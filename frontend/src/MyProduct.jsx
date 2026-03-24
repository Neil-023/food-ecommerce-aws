import React, { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import './MyProduct.css';
import { Link } from 'react-router-dom';
import { mockData } from './mockData';
import axios from 'axios';

const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true';

const FALLBACK_IMAGE = 'https://via.placeholder.com/160x160?text=Product';
const resolveImage = (imageUrl) => {
  if (typeof imageUrl !== 'string') {
    return FALLBACK_IMAGE;
  }
  const trimmed = imageUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return FALLBACK_IMAGE;
  }
  return trimmed;
};

function MyProduct() {
  const fallbackProducts = useMemo(
    () =>
      mockData.product_tbl
        .map((product) => ({
          ...product,
          product_img_url: resolveImage(product.product_img),
        })),
    []
  );

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        const normalized = (response.data ?? []).map((product) => ({
          ...product,
          product_img_url: resolveImage(product.product_img),
        }));
        setProducts(normalized);
      } catch (error) {
        console.error('Failed to load products', error);
        if (USE_MOCK_FALLBACK) {
          setProducts(fallbackProducts);
        }
      }
    };

    void loadProducts();
  }, [fallbackProducts]);

  const handleRemove = async (productId) => {
    if (!window.confirm('Remove this product?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/products/${productId}`);
      setProducts((prev) => prev.filter((product) => product.product_id !== productId));
    } catch (error) {
      console.error('Failed to remove product', error);
      if (USE_MOCK_FALLBACK) {
        setProducts((prev) => prev.filter((product) => product.product_id !== productId));
      }
    }
  };

  const updateStock = async (productId, operation) => {
    const target = products.find((product) => product.product_id === productId);
    if (!target) {
      return;
    }

    const delta = operation === 'add' ? 1 : -1;
    const nextStock = Math.max(0, Number(target.avail_stocks) + delta);

    try {
      const response = await axios.put(`/api/admin/products/${productId}/stock`, {
        avail_stocks: nextStock,
      });
      const updated = response.data;
      setProducts((prev) =>
        prev.map((product) =>
          product.product_id === productId
            ? { ...product, avail_stocks: updated.avail_stocks }
            : product
        )
      );
    } catch (error) {
      console.error('Failed to update stock', error);
      if (USE_MOCK_FALLBACK) {
        setProducts((prev) =>
          prev.map((product) =>
            product.product_id === productId
              ? { ...product, avail_stocks: nextStock }
              : product
          )
        );
      }
    }
  };

  return (
    <div className="myproduct-body">
      <Navbar />
      <div className="myproduct-container">
        <div className="myproduct-header">
          <h2>My Products</h2>
          <Link to="/add-product">
            <button className="addproduct-btn">Add Product</button>
          </Link>
        </div>

        <div className="myproduct-contents">
          {products.length === 0 && <p>No products yet.</p>}

          {products.map((product) => (
            <div className="cart-card2" key={product.product_id}>
              <img
                src={resolveImage(product.product_img)}
                alt={product.product_name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="cart-card-details2">
                <div className="cart-header2">
                  <h3 className="cart-pizza-name2">{product.product_name}</h3>
                  <h4>
                    {mockData.category_tbl.find((cat) => cat.category_id === product.category_id)
                      ?.category_name || 'Uncategorized'}
                  </h4>
                </div>

                <div className="cart-card-info2">
                  <div>
                    <div className="price-div">
                      <p>Price</p>
                      <p>
                        <b>₱{product.price}</b>
                      </p>
                    </div>
                    <p>Stock</p>
                    <div className="stock-counter">
                      <button onClick={() => updateStock(product.product_id, 'subtract')}>-</button>
                      <p>{product.avail_stocks}</p>
                      <button onClick={() => updateStock(product.product_id, 'add')}>+</button>
                    </div>
                  </div>

                  <div className="line"></div>

                  <div className="product-date">
                    <div>
                      Added at
                      <br />
                      {new Date().toLocaleDateString()}
                    </div>
                    <div>
                      Updated at
                      <br />
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <button
                  className="removeproduct-btn"
                  onClick={() => handleRemove(product.product_id)}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyProduct;
