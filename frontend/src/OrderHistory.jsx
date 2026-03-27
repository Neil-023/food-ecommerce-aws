// OrderHistory.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import OrderHistoryCard from './components/OrderHistoryCard';
import './OrderHistory.css';
import { mockData } from './mockData';
import axios from 'axios';
import { preloadImagesWithProgress } from './imagePreload';

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

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setPreloadProgress(0);
      try {
        const response = await axios.get('/api/orders');
        const apiOrders = (response.data ?? []).map((order) => ({
          ...order,
          overall_status: order.status,
          ordered_at: order.ordered_at ?? new Date().toISOString(),
          shops: (order.shops ?? []).map((shop) => ({
            ...shop,
            items: (shop.items ?? []).map((item) => ({
              ...item,
              product_img: resolveImage(item.product_img),
            })),
          })),
        }));

        const imageUrls = apiOrders.flatMap((order) =>
          (order.shops ?? []).flatMap((shop) =>
            (shop.items ?? []).map((item) => item.product_img)
          )
        );
        await preloadImagesWithProgress(imageUrls, (percent) => setPreloadProgress(percent));
        setOrders(apiOrders);
      } catch (error) {
        console.error('Failed to load orders', error);
        if (!USE_MOCK_FALLBACK) {
          setOrders([]);
          return;
        }

        const productsById = new Map(mockData.product_tbl.map((product) => [product.product_id, product]));
        const formattedOrders = mockData.orders_tbl.map((order) => {
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
            ...order,
            overall_status: order.status,
            ordered_at: order.ordered_at ?? new Date().toISOString(),
            shops: [
              {
                seller_id: 1,
                seller_name: 'Admin Store',
                status: order.status,
                items,
              },
            ],
          };
        });

        const imageUrls = formattedOrders.flatMap((order) =>
          (order.shops ?? []).flatMap((shop) =>
            (shop.items ?? []).map((item) => item.product_img)
          )
        );
        await preloadImagesWithProgress(imageUrls, (percent) => setPreloadProgress(percent));
        setOrders(formattedOrders);
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, []);

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="page-loading-screen">
          <div className="page-loading-panel">
            <div className="page-loading-spinner" />
            <p className="page-loading-text">Loading order images... {preloadProgress}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="order-history-body">
        <div className="order-history-container">
          <div className="order-history-title">Order History</div>

          {orders.length === 0 && <p>No past orders found.</p>}

          {orders.map(order => (
            <div key={order.order_id} className="order-group">
              <h2>
                Order #{order.order_id} — {new Date(order.ordered_at).toLocaleDateString()}
                {' '}<span className="status">{order.overall_status}</span>
              </h2>

              <div className="shops-list">
                {order.shops.map(shop => (
                  <OrderHistoryCard
                    key={shop.seller_id}
                    id={order.order_id}
                    shopname={shop.seller_name}
                    date={order.ordered_at}
                    status={shop.status}
                    items={shop.items}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;
