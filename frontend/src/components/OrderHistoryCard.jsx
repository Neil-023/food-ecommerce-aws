import React from 'react';
import OrderHistoryItem from './OrderHistoryItem';
import './OrderHistoryCard.css';

export default function OrderHistoryCard({ id, shopname, date, status, isManager, items, onStatusChange }) {
  const total = items.reduce(
    (acc, item) => acc + Number(item.price_each) * item.quantity,
    0
  );

  return (
    <div className="order-history-card">
      <div className="order-header">
        <div className="order-header-1strow">
          <div className="order-id">{shopname}</div>

          {/* Dropdown to change status */}
          {isManager
            ? (
              <select
                className={`order-status-select ${status}`}
                value={status}
                onChange={e => onStatusChange(id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
            )
            : (
              <span className={`order-status-badge ${status}`}>{status}</span>
            )
          }
        </div>

        <div className="order-header-date">
          Ordered at {new Date(date).toLocaleString()}
        </div>
      </div>

      <div className="order-items">
        {items.map((item, index) => (
          <OrderHistoryItem key={index} {...item} />
        ))}
      </div>

      <div className="order-total">Total: ₱{total.toLocaleString()}</div>
    </div>
  );
}
