// SellerOrderPage.jsx
import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import OrderHistoryCard from './components/OrderHistoryCard';
import './OrderHistory.css';
import './components/OrderHistoryCard.css';
import './components/OrderHistoryItem.css';
import { mockData } from './mockData';
import axios from 'axios';

const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true';

const FALLBACK_IMAGE = 'https://via.placeholder.com/64x64?text=Food';
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

function SellerOrderPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await axios.get('/api/admin/orders');
        const formatted = (response.data ?? []).map((order) => ({
          ...order,
          items: (order.items ?? []).map((item) => ({
            ...item,
            product_img: resolveImage(item.product_img),
          })),
        }));
        setOrders(formatted);
      } catch (error) {
        console.error('Failed to load admin orders', error);
        if (!USE_MOCK_FALLBACK) {
          setOrders([]);
          return;
        }

        const ordersById = new Map(mockData.orders_tbl.map((order) => [order.order_id, order]));
        const usersById = new Map(mockData.users_tbl.map((user) => [user.user_id, user]));
        const productsById = new Map(mockData.product_tbl.map((product) => [product.product_id, product]));
        const formatted = mockData.orders_tbl.map((order) => {
          const buyer = usersById.get(order.buyer_id);
          const items = mockData.order_items_tbl
            .filter((item) => item.order_id === order.order_id)
            .map((item) => {
              const product = productsById.get(item.product_id);
              return {
                product_id: item.product_id,
                product_name: product?.product_name ?? 'Unknown Product',
                product_img: resolveImage(product?.product_img),
                quantity: item.quantity,
                price_each: item.price_each ?? product?.price ?? 0,
              };
            });

          return {
            order_id: order.order_id,
            ordered_at: ordersById.get(order.order_id)?.ordered_at ?? new Date().toISOString(),
            status: order.status,
            customer_name: buyer?.full_name ?? 'Unknown Customer',
            isManager: true,
            items,
          };
        });
        setOrders(formatted);
      }
    };

    void loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );
    } catch (error) {
      console.error('Failed to update order status', error);
      alert(error?.response?.data?.detail ?? 'Failed to update order status.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="order-history-body">
        <div className="order-history-container">
          <div className="order-history-title">My Shop's Orders</div>

          {orders.length === 0 && <p>No orders for your shop yet.</p>}

          {orders.map((order) => (
            <div key={order.order_id} className="order-group">
              <h2>
                Order #{order.order_id} — {new Date(order.ordered_at).toLocaleDateString()}
              </h2>

              <OrderHistoryCard
                id={order.order_id}
                shopname={order.customer_name}
                date={order.ordered_at}
                isManager={order.isManager}
                status={order.status}
                items={order.items}
                onStatusChange={handleStatusChange}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SellerOrderPage;
