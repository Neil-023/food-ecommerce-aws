import React from 'react';
import './OrderHistoryItem.css';

export default function OrderHistoryItem({
  product_img,
  product_name,
  quantity,
  price_each,
}) {
  const imgSrc = product_img || '/fallback.png';

  return (
    <div className="order-history-item">
    
      <div className="order-history-item-left">
        <img
          className="order-item-img"
          src={imgSrc}
          alt={product_name}
          onError={e => { e.target.src = '/fallback.png'; }}
        />
        <div className="order-item-details">
          <div className="order-item-name">{product_name}</div>
          <div className="order-item-qty">{quantity}×</div>
        </div>
      </div>

      {/* RIGHT: price */}
      <div className="order-history-item-right">
        ₱{Number(price_each).toFixed(2)}
      </div>
    </div>
  );
}
