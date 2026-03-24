// Navbar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MainPage.css';
import { useSeller } from './SellerContext';
import axios from 'axios';
import { useCart } from './CartContext';

function Navbar() {
  const goToAddProduct = () => navigate('/add-product');
  const goToCart = async () => {
    await loadCart();  
    navigate('/cart');
  };
  const goToOrderHistory = () => navigate('/OrderHistory');
  const goToMyProduct = () => navigate('/MyProduct');
  const goToAnalytics = () => navigate('/Analytics');
  const goToSellersPage = () => navigate('/seller');
  const goToSellerOrderPage = () => navigate('/SellerOrderPage');
  const navigate = useNavigate();
  const location = useLocation();
  const { isSeller, setIsSeller } = useSeller();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { loadCart } = useCart();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };
  const handleLogout = async () => {
    try {
      await axios.post('/api/logout', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      // clear client state:
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.setItem('role', 'buyer');  // or removeItem
      setIsSeller(false);
      navigate('/');
    } catch (err) {
      console.error('Logout failed', err);
      console.log(localStorage.getItem('auth_token'));
    }
  };

  return (
    <div className={`top-navbar ${scrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <button
        className="mobile-menu-btn"
        onClick={toggleMobileMenu}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
        type="button"
      >
        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
      </button>

      <div className="nav-links">
        <button
          className={`nav-btn ${location.pathname === '/MainPage' ? 'active' : ''}`}
          onClick={() => navigate('/MainPage')}
        >
          Home
        </button>

        {isSeller ? (
          <button
            className={`nav-btn ${location.pathname === '/add-product' ? 'active' : ''}`}
            onClick={goToAddProduct}
          >
            Add Product
          </button>
        ) : (
          <button
            className={`nav-btn ${location.pathname === '/MainPage' ? 'active' : ''}`}
            onClick={() => navigate('/MainPage')}
          >
            Browse Store
          </button>
        )}

        <button
          className={`nav-btn ${location.pathname === '/cart' ? 'active' : ''}`}
          onClick={goToCart}
        >
          Cart
        </button>

        <button
          className={`nav-btn ${location.pathname === '/OrderHistory' ? 'active' : ''}`}
          onClick={goToOrderHistory}
        >
          Order History
        </button>

        {isSeller && (
          <>
            <button
              className={`nav-btn ${location.pathname === '/MyProduct' ? 'active' : ''}`}
              onClick={goToMyProduct}
            >
              My Product
            </button>
            <button
              className={`nav-btn ${location.pathname === '/SellerOrderPage' ? 'active' : ''}`}
              onClick={goToSellerOrderPage}
            >
              Customer Orders
            </button>
            <button
              className={`nav-btn ${location.pathname === '/Analytics' ? 'active' : ''}`}
              onClick={goToAnalytics}
            >
              Analytics
            </button>
          </>
        )}

        <button className="nav-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
