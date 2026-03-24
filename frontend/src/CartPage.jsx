import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';
import { useCart } from './CartContext';
import Navbar from './Navbar';
import axios from 'axios';

const FALLBACK_IMAGE = 'https://via.placeholder.com/120x120?text=Item';
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

function CartPage() {
  const { cartBySeller, loadCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const allItems = cartBySeller.flatMap((seller) => seller.items);
  const grandTotal = allItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (allItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    try {
      await axios.post('/api/orders', {});
      await clearCart();
      alert('Checkout successful!');
      navigate('/OrderHistory');
    } catch (error) {
      console.error('Checkout failed', error);
      alert(error?.response?.data?.detail ?? 'Checkout failed. Please try again.');
    }
  };

  return (
    <div className="cart-page">
      <Navbar />

      <h1 className="cart-title">Your Cart</h1>

      <div className="cart-items">
        {cartBySeller.length === 0 && (
          <p className="empty-cart-msg">Your cart is empty.</p>
        )}

        {cartBySeller.map((seller) => (
          <div key={seller.seller_id} className="seller-group2">
            <h2 className="cart-title2">Shop: {seller.seller_name}</h2>
            <div className="seller-group">
              {seller.items.map((item) => (
                <div key={item.product_id} className="cart-card">
                  <img
                    src={resolveImage(item.product_img)}
                    alt={item.product_name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                  <div className="cart-card-details">
                    <h3 className="cart-pizza-name">{item.product_name}</h3>
                    <div className="cart-card-info">
                      <div>
                        <p>Price = ₱{(Number(item.price) || 0).toFixed(2)}</p>
                        <p>
                          Total Price = ₱
                          {((Number(item.price) || 0) * item.quantity).toFixed(2)}
                        </p>
                        <div className="quantity-control">
                          <button
                            onClick={() => {
                              if (
                                item.quantity === 1 &&
                                !window.confirm('Remove this item?')
                              ) {
                                return;
                              }
                              updateQuantity(item.product_id, item.quantity - 1);
                            }}
                          >
                            –
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="receipt">
        <h2>Receipt</h2>
        <div className="receipt-items">
          {allItems.map((item, index) => (
            <div className="receipt-item" key={`${item.product_id}-${index}`}>
              <div className="item-info">
                <p>
                  {item.product_name} × {item.quantity}
                </p>
                <p>
                  ₱{(Number(item.price) || 0).toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="item-total">
                <p>₱{((Number(item.price) || 0) * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <hr />
        <h3 className="total-price">Total: ₱{grandTotal.toFixed(2)}</h3>
      </div>

      <div className="checkout-bar">
        <p className="checkout-bar-total">Total: ₱{grandTotal.toFixed(2)}</p>
        <button className="checkout-btn" onClick={handleCheckout}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default CartPage;