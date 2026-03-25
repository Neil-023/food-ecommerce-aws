import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from './CartContext';
import Navbar from './Navbar';
import './MainPage.css';
import { mockData } from './mockData';
import axios from 'axios';

const FALLBACK_IMAGE = 'https://via.placeholder.com/600x400?text=Food';

const resolveImage = (imageUrl) => {
  if (typeof imageUrl !== 'string') return FALLBACK_IMAGE;
  const trimmed = imageUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return FALLBACK_IMAGE;
  }
  return trimmed;
};

const CATEGORY_SWITCH_DELAY = 500;
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true';

function MainPage({ sellerId }) {
  const { cartBySeller, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [direction, setDirection] = useState('next');
  const [isExiting, setIsExiting] = useState(false);
  const [cardStartIndex, setCardStartIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const categorySwitchTimeout = useRef(null);

  const numericSellerId = sellerId ? Number(sellerId) : null;

  // Load categories/products from API first, then fallback to mock data when enabled.
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get('/api/products', {
            params: numericSellerId ? { seller_id: numericSellerId } : undefined,
          }),
          axios.get('/api/categories'),
        ]);

        const normalizedProducts = (productsResponse.data ?? []).map((product) => ({
          ...product,
          stock: product.avail_stocks,
          image: resolveImage(product.product_img),
        }));
        setProducts(normalizedProducts);
        setCategories(categoriesResponse.data ?? []);
      } catch (error) {
        console.error('Failed to load catalog from API', error);
        if (!USE_MOCK_FALLBACK) {
          setProducts([]);
          setCategories([]);
          return;
        }

        const fallbackProducts = mockData.product_tbl
          .filter((product) => (numericSellerId ? product.seller_id === numericSellerId : true))
          .map((product) => ({
            ...product,
            stock: product.avail_stocks,
            image: resolveImage(product.product_img),
          }));
        setProducts(fallbackProducts);
        setCategories(mockData.category_tbl);
      }
    };

    void loadCatalog();
  }, [numericSellerId]);

  // Determine available categories based on loaded products
  const availableCategories = useMemo(() => {
    const categoriesWithProducts = new Set(products.map((p) => String(p.category_id)));
    return categories.filter((cat) => categoriesWithProducts.has(String(cat.category_id)));
  }, [categories, products]);

  // Set initial category safely
  useEffect(() => {
    if (!availableCategories.length) {
      setCategory('');
      return;
    }
    setCategory((current) => {
      const stillValid = availableCategories.some((cat) => String(cat.category_id) === current);
      return stillValid ? current : String(availableCategories[0].category_id);
    });
  }, [availableCategories]);

  // Derive items for the current category
  const items = useMemo(
    () => products.filter((product) => String(product.category_id) === category),
    [products, category]
  );
  const currentItem = items[activeIndex] ?? null;

  // Reset states when category changes
  useEffect(() => {
    setActiveIndex(0);
    setPrevIndex(null);
    setCardStartIndex(0);
    setQuantity(1);
    setDirection('next');
    setIsExiting(false);
  }, [category]);

  // Safe-guard active index
  useEffect(() => {
    if (items.length > 0 && activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items.length, activeIndex]);

  // Keep preview cards aligned with active index
  useEffect(() => {
    if (activeIndex < cardStartIndex) {
      setCardStartIndex(activeIndex);
    } else if (activeIndex >= cardStartIndex + 5) {
      setCardStartIndex(activeIndex - 4);
    }
  }, [activeIndex, cardStartIndex]);

  // Cart derivation
  const cartItems = cartBySeller.flatMap((seller) => seller.items);
  const cartIds = useMemo(() => new Set(cartItems.map((item) => item.product_id)), [cartItems]);
  const isInCart = currentItem ? cartIds.has(currentItem.product_id) : false;
  const isOutOfStock = currentItem ? currentItem.stock <= 0 : true;
  const fullImageUrl = currentItem?.image ?? FALLBACK_IMAGE;

  // Carousel controls
  const changeSlide = (dir) => {
    if (isExiting || items.length <= 1) return;
    setDirection(dir);
    setIsExiting(true);
    setPrevIndex(activeIndex);

    setTimeout(() => {
      setActiveIndex((prev) =>
        dir === 'next' ? (prev + 1) % items.length : (prev - 1 + items.length) % items.length
      );
      setIsExiting(false);
    }, 800);
  };

  const handlePreviewClick = (newIndex) => {
    if (isExiting || newIndex === activeIndex) return;
    setDirection(newIndex > activeIndex ? 'next' : 'prev');
    setIsExiting(true);
    setPrevIndex(activeIndex);

    setTimeout(() => {
      setActiveIndex(newIndex);
      setIsExiting(false);
    }, 800);
  };

  const handleAddToCart = (product) => {
    if (!product || product.stock <= 0) return;
    addToCart(product, quantity);
    setProducts((prev) =>
      prev.map((item) =>
        item.product_id === product.product_id
          ? { ...item, stock: Math.max(0, item.stock - quantity) }
          : item
      )
    );
    setQuantity(1);
  };

  const handleCategorySelect = (catId) => {
    if (category === catId || isExiting) return;
    if (categorySwitchTimeout.current) clearTimeout(categorySwitchTimeout.current);

    setPrevIndex(activeIndex);
    setDirection('next');
    setIsExiting(true);

    categorySwitchTimeout.current = setTimeout(() => {
      setCategory(catId);
      categorySwitchTimeout.current = null;
    }, CATEGORY_SWITCH_DELAY);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (categorySwitchTimeout.current) clearTimeout(categorySwitchTimeout.current);
    };
  }, []);

  if (!availableCategories.length || !currentItem) {
    return (
      <div className="main-page">
        <Navbar />
        <div className="empty-state">No products available yet.</div>
      </div>
    );
  }

  const nameParts = currentItem.product_name?.split(' ') ?? [];
  const labelText = nameParts[1] || nameParts[0] || '';
  const labelLength = labelText.length;
  const dynamicLabelSize = Math.max(2.2, 7 - labelLength * 0.24);
  const renderPizzaName = (className) => (
    <div className={className}>
      <h2>
        <span className="top-label">
          {`Top ${activeIndex + 1} Best Seller`.split('').map((char, i) => (
            <span
              key={i}
              className={`letter ${isExiting ? 'fade-out' : 'fade-in'}`}
              style={{ animationDelay: `${1000 + i * 30}ms` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
        <br />
        <span className="pizza-title">
          {(nameParts[0] ?? '').split('').map((char, i) => (
            <span
              key={i}
              className={`letter ${isExiting ? 'fade-out' : 'fade-in'}`}
              style={{ animationDelay: `${1000 + i * 30}ms` }}
            >
              {char}
            </span>
          ))}
        </span>
        <br />
        <span
          className="pizza-label"
          style={{
            fontSize: `clamp(2rem, ${dynamicLabelSize}vw, 6rem)`,
            transition: 'font-size 0.25s ease',
          }}
        >
          {labelText.split('').map((char, i) => (
            <span
              key={i}
              className={`letter ${isExiting ? 'fade-out' : 'fade-in'}`}
              style={{ animationDelay: `${1000 + (i + currentItem.product_name.length) * 30}ms` }}
            >
              {char}
            </span>
          ))}
        </span>
      </h2>
    </div>
  );

  return (
    <div className="main-page">
      <Navbar />

      <div className="carousel-container">
        <div className="circle"></div>

        {isExiting && prevIndex !== null && (
          <div className={`slide exit ${direction}`}>
            <img
              src={items[prevIndex].image}
              alt={`Item ${prevIndex + 1}`}
              onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
            />
          </div>
        )}

        {!isExiting && (
          <div className={`slide enter ${direction}`}>
            <img
              src={fullImageUrl}
              alt={`Item ${activeIndex + 1}`}
              onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
            />
          </div>
        )}

        {renderPizzaName('pizza-name desktop-only')}
      </div>

      <div className="mobile-scroll-section">
        <div className="pizza-details-card">
          {renderPizzaName('pizza-name mobile-only')}
          <p className="product-desc">Overview</p>
          <div className="price fade-in-up" key={`price-${activeIndex}`}>
            <p>₱{currentItem.price}</p>
          </div>
          <h3 className="fade-in-left" key={currentItem.product_name}>{currentItem.product_name}</h3>
          <p className="fade-in-left" key={`desc-${activeIndex}`}>{currentItem.product_desc}</p>
          <p>Stock left: {currentItem.stock}</p>

          <div className="quantity-container">
            <p>Quantity: </p>
            <div className="quantity-control">
              <button onClick={() => setQuantity((v) => Math.max(1, v - 1))}>-</button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity((v) => Math.min(v + 1, currentItem.stock))}
                disabled={quantity >= currentItem.stock}
              >
                +
              </button>
            </div>
          </div>

          <button
            className="add-to-cart-btn"
            onClick={() => handleAddToCart(currentItem)}
            disabled={isExiting || isOutOfStock || isInCart}
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {isOutOfStock ? 'Out of Stock' : isInCart ? 'Already in Cart' : 'Add to Cart'}
          </button>
        </div>

        <div className="bottom-carousel">
          <button className="small-nav" onClick={() => changeSlide('prev')}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <div className="preview-cards" key={`previews-${category}`}>
            {items.slice(cardStartIndex, cardStartIndex + 5).map((pizza, index) => (
              <div
                key={`${pizza.product_id}-${category}`}
                className={`preview-card ${activeIndex === cardStartIndex + index ? 'active-preview' : ''}`}
                onClick={() => handlePreviewClick(cardStartIndex + index)}
              >
                <img
                  src={pizza.image}
                  alt={pizza.product_name}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                />
                <p>{pizza.product_name}</p>
              </div>
            ))}
          </div>

          <button className="small-nav" onClick={() => changeSlide('next')}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="dots-container">
        {items.map((_, i) => (
          <div
            key={i}
            className={`dot ${i === activeIndex ? 'active-dot' : ''}`}
            onClick={() => handlePreviewClick(i)}
          />
        ))}
      </div>

      <div className="bottom-nav-bar">
        {availableCategories.map((cat) => (
          <button
            key={cat.category_id}
            className={`category-btn ${category === String(cat.category_id) ? 'active-category' : ''}`}
            onClick={() => handleCategorySelect(String(cat.category_id))}
          >
            <span className="material-symbols-outlined">{cat.icon_name}</span>
            {cat.category_name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MainPage;