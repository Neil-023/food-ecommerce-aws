import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import MainPage from './MainPage.jsx';
import AddProductPage from './AddProductPage';
import CartPage from './CartPage';
import ApplySeller from './ApplySeller.jsx';
import SellerList from './SellerList.jsx';
import React from 'react';
import { CartProvider } from './CartContext';
import { SellerProvider } from './SellerContext.jsx';
import OrderHistory from './OrderHistory.jsx';
import MyProduct from './MyProduct';
import Analytics from './Analytics';
import SellerOrderPage from './SellerOrderPage.jsx';
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;

let isRefreshing = false;
let pendingQueue = [];
const DEMO_MODE_MESSAGE = 'Modifications are disabled in Demo Mode.';

const processQueue = (error, token = null) => {
  pendingQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
      return;
    }
    promise.resolve(token);
  });
  pendingQueue = [];
};

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && error.response?.data?.detail === DEMO_MODE_MESSAGE) {
      toast.error(DEMO_MODE_MESSAGE, { toastId: 'demo-mode-disabled' });
      return Promise.reject(error);
    }

    if (originalRequest?.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error);
    }

    if (!error.response || error.response.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post('/api/auth/refresh', {
        refresh_token: refreshToken,
      });

      const nextAccessToken = refreshResponse.data?.auth_token;
      const nextRefreshToken = refreshResponse.data?.refresh_token;
      if (nextAccessToken) {
        localStorage.setItem('auth_token', nextAccessToken);
      }
      if (nextRefreshToken) {
        localStorage.setItem('refresh_token', nextRefreshToken);
      }

      processQueue(null, nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.setItem('role', 'buyer');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SellerProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/MainPage" element={<MainPage />} />
            <Route path="/add-product" element={<AddProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/OrderHistory" element={<OrderHistory />} />
            <Route path="/MyProduct" element={<MyProduct />} />
            <Route path="/Analytics" element={<Analytics />} />
            <Route path="/ApplySeller" element={<ApplySeller />} />
            <Route path="/seller" element={<SellerList />} />
            <Route path="/seller/:sellerId" element={<DynamicSeller />} />
            <Route path="/SellerOrderPage" element={<SellerOrderPage />} />
          </Routes>
          <ToastContainer
            position="bottom-right"
            autoClose={6000}
            hideProgressBar
            closeOnClick
            pauseOnHover={false}
          />
        </BrowserRouter>
      </CartProvider>
    </SellerProvider>
  </React.StrictMode>
);

function DynamicSeller() {
  const { sellerId } = useParams();
  return <SellerList sellerId={sellerId} />;
}
