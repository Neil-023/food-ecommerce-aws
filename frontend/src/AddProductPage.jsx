import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddProductPage.css';
import Navbar from './Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { mockData } from './mockData';
import axios from 'axios';

const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true';

function AddProductPage() {
  const navigate = useNavigate();
  const [availableStock, setAvailableStock] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingCategoryName, setPendingCategoryName] = useState('');
  const [pendingCategoryIcon, setPendingCategoryIcon] = useState('more_horiz');

  // product form state
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const availableIcons = [
    'local_pizza', 'local_cafe', 'fork_spoon', 'dinner_dining', 'icecream',
    'lunch_dining', 'cookie', 'local_bar', 'bakery_dining', 'kebab_dining',
    'skillet', 'room_service', 'soup_kitchen', 'stockpot', 'egg_alt', 'grocery',
    'blender', 'bento', 'outdoor_grill', 'restaurant', 'tapas', 'nutrition', 'brunch_dining'
  ];

  const OTHER_CATEGORY = { category_id: '__custom__', name: 'Other', icon: 'add' };

  const getVisibleCategories = (sourceCategories, focusCategoryId = null) => {
    const normalized = [...sourceCategories];
    const topFour = normalized.slice(0, 4);
    if (!focusCategoryId || focusCategoryId === '__custom__') {
      return [...topFour, OTHER_CATEGORY];
    }

    const inTopFour = topFour.some((category) => category.category_id === focusCategoryId);
    if (inTopFour) {
      return [...topFour, OTHER_CATEGORY];
    }

    const focused = normalized.find((category) => category.category_id === focusCategoryId);
    if (!focused) {
      return [...topFour, OTHER_CATEGORY];
    }

    return [...topFour, focused];
  };

  function handleImageUpload(e) {
    const file = e.target.files[0];
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSaveCategory() {
    const trimmedCategoryName = pendingCategoryName.trim();
    if (!trimmedCategoryName) {
      toast.error('Please enter a category name.');
      return;
    }

    try {
      const categoryResponse = await axios.post('/api/admin/categories', {
        category_name: trimmedCategoryName,
        icon_name: pendingCategoryIcon,
      });

      const created = categoryResponse.data;
      setCategories((prev) => {
        const withoutCustom = prev.filter((category) => category.category_id !== '__custom__');
        const createdCategory = {
          category_id: created.category_id,
          name: created.category_name,
          icon: created.icon_name ?? 'more_horiz',
        };
        const existingIndex = withoutCustom.findIndex((category) => category.category_id === created.category_id);
        const merged = existingIndex >= 0
          ? withoutCustom.map((category, idx) => (idx === existingIndex ? createdCategory : category))
          : [...withoutCustom, createdCategory];
        const nextWithOther = getVisibleCategories(merged, created.category_id);
        const createdIndex = nextWithOther.findIndex((category) => category.category_id === created.category_id);
        setSelectedIndex(createdIndex >= 0 ? createdIndex : 0);
        return nextWithOther;
      });

      setPendingCategoryName('');
      setPendingCategoryIcon('more_horiz');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to create category', error);
      if (!USE_MOCK_FALLBACK) {
        toast.error(error?.response?.data?.detail ?? 'Failed to create category.');
        return;
      }

      setCategories((prev) => {
        const withoutCustom = prev.filter((category) => category.category_id !== '__custom__');
        const localCategory = {
          category_id: `local_${Date.now()}`,
          name: trimmedCategoryName,
          icon: pendingCategoryIcon,
        };
        const nextWithOther = getVisibleCategories([...withoutCustom, localCategory], localCategory.category_id);
        const createdIndex = nextWithOther.findIndex((category) => category.category_id === localCategory.category_id);
        setSelectedIndex(createdIndex >= 0 ? createdIndex : 0);
        return nextWithOther;
      });

      setPendingCategoryName('');
      setPendingCategoryIcon('more_horiz');
      setShowModal(false);
    }
  }

  async function handleAddProduct() {
    let catId = categories[selectedIndex]?.category_id ?? null;
    const cleanedName = productName.trim();
    const cleanedDescription = productDescription.trim();
    const parsedPrice = Number(productPrice);
    const parsedStock = Number(availableStock);

    if (!cleanedName || !cleanedDescription || Number.isNaN(parsedPrice) || Number.isNaN(parsedStock) || !catId || catId === '__custom__') {
      toast.error('Please complete all fields before adding a product.', {
        style: {
          fontSize: '18px',
          minWidth: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
      return;
    }

    if (parsedPrice <= 0 || parsedStock < 0) {
      toast.error('Price must be greater than 0 and stock cannot be negative.');
      return;
    }

    if (!imageFile) {
      toast.error('Please upload a product image before adding.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const uploadResponse = await axios.post('/api/admin/uploads/product-image', formData);
      const uploadedImageUrl = uploadResponse.data?.image_url ?? null;
      if (!uploadedImageUrl) {
        throw new Error('Upload response did not include an image URL.');
      }

      const createResponse = await axios.post('/api/admin/products', {
        category_id: Number(catId),
        product_name: cleanedName,
        product_desc: cleanedDescription,
        price: parsedPrice,
        avail_stocks: parsedStock,
        product_img: uploadedImageUrl,
      });

      const createdProduct = createResponse.data;
      if (!createdProduct?.product_id) {
        throw new Error('Product creation response is missing product_id.');
      }
      if (!createdProduct?.product_img || createdProduct.product_img !== uploadedImageUrl) {
        throw new Error('Product was created but image URL was not saved correctly.');
      }

      toast.success('Product added successfully!', {
        style: {
          fontSize: '20px',
          minWidth: '500px',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
    } catch (error) {
      console.error('Failed to add product', error);
      toast.error(error?.response?.data?.detail ?? error?.message ?? 'Failed to add product.');
      return;
    }

    setProductName('');
    setProductPrice('');
    setProductDescription('');
    setAvailableStock('');
    setImageFile(null);
    setImagePreview(null);
    setPendingCategoryName('');
    setPendingCategoryIcon('more_horiz');
    setShowModal(false);
  }

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        const baseCategories = (response.data ?? []).map((cat) => ({
          category_id: cat.category_id,
          name: cat.category_name,
          icon: cat.icon_name ?? 'more_horiz',
        }));

        const prefixedCategories = getVisibleCategories(baseCategories);
        setCategories(prefixedCategories);
        setSelectedIndex(prefixedCategories.length ? 0 : null);
      } catch (error) {
        console.error('Failed to load categories', error);
        const baseCategories = mockData.category_tbl
          .slice(0, 4)
          .map((cat) => ({
            category_id: cat.category_id,
            name: cat.category_name,
            icon: cat.icon_name ?? 'more_horiz',
          }));

        const prefixedCategories = getVisibleCategories(baseCategories);

        setCategories(prefixedCategories);
        if (prefixedCategories.length) {
          setSelectedIndex(0);
        }
      }
    };

    void loadCategories();
  }, []);

  return (
    <div className="add-product-page">
      <Navbar />
      <ToastContainer
        position="bottom-right"
        autoClose={6000}
        hideProgressBar
        closeOnClick
        pauseOnHover={false}
      />
      <div className="section1">
        <h2 className="add-product-title">Add New Product</h2>
        <p className="category-title">Category</p>
        <div className="category-container">
          {categories.map((cat, i) => (
            <button
              key={cat.category_id ?? i}
              className={`category-btn ${selectedIndex === i ? 'selected' : ''}`}
              onClick={() => {
                setSelectedIndex(i);
                if (cat.category_id === '__custom__') {
                  setShowModal(true);
                }
              }}
            >
              <span className="material-symbols-outlined">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <p className='details-title'>Product Details</p>
        <div className="details-container">
          <div className='input-container container1'>
            <div className="input-group">
              <label className="input-label">Product Name</label>
              <input
                className="input-field"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Product Price</label>
              <input
                className="input-field"
                value={productPrice}
                onChange={e => setProductPrice(e.target.value)}
                placeholder="Enter product price"
              />
            </div>
          </div>
          <div className='input-container'>
            <div className="input-group">
              <label className="input-label">Product Description</label>
              <textarea
                className="input-field description-field"
                value={productDescription}
                onChange={e => setProductDescription(e.target.value)}
                placeholder="Enter product description"
              />
            </div>
            <div className="input-container">
              <div className="input-group stock-field">
                <label className="input-label">Available Stock</label>
                <input
                  className="input-field"
                  type="number"
                  value={availableStock}
                  onChange={e => setAvailableStock(e.target.value)}
                  placeholder="Enter available stock"
                  min="0" // Ensures only non-negative numbers
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add a New Category</h2>
            <div className="input-group">
              <label className="input-label">Category Name</label>
              <input
                className="input-field  cat-name"
                value={pendingCategoryName}
                onChange={e => setPendingCategoryName(e.target.value)}
                placeholder="e.g. ‘Snacks’"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Choose Icon</label>
              <div className="icon-grid">
                {availableIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${pendingCategoryIcon === icon ? 'selected' : ''}`}
                    onClick={() => setPendingCategoryIcon(icon)}
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button onClick={handleSaveCategory} className="add-product-btn">Save</button>
              <button onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className='image-container'>
        <div className="image-container2" onClick={() => document.getElementById('imageInput').click()}>
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          {imagePreview
            ? <img src={imagePreview} className="uploaded-image" alt="" />
            : <div className="upload-placeholder">
                <span className="material-symbols-outlined">image</span>
                <p>Click to upload image</p>
              </div>
          }
        </div>
        <div className='button-container'>
          <button onClick={handleAddProduct} className="add-product-btn">Add Product</button>
          <button className="cancel-btn" onClick={() => navigate('/MainPage')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AddProductPage;
