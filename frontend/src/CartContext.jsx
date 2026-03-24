import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import axios from 'axios';
import { mockData } from './mockData';

const CartContext = createContext();
const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_FALLBACK === 'true';

const DEFAULT_CART_ID = mockData.cart_tbl[0]?.cart_id ?? 0;

const buildCartState = (items) => {
  if (!items?.length) {
    return [];
  }
  return [
    {
      seller_id: 1,
      seller_name: 'Admin Store',
      items: items.map((item) => ({ ...item })),
    },
  ];
};

export function CartProvider({ children }) {
  const [rawItems, setRawItems] = useState(() =>
    mockData.cart_items_tbl
      .filter((item) => item.cart_id === DEFAULT_CART_ID)
      .map((item) => ({ ...item }))
  );
  const [cartBySeller, setCartBySeller] = useState(() => buildCartState(rawItems));

  const syncCart = useCallback((nextItems = []) => {
    setRawItems(nextItems);
    setCartBySeller(buildCartState(nextItems));
  }, []);

  const hydrateFromMock = useCallback(() => {
    const productById = new Map(mockData.product_tbl.map((product) => [product.product_id, product]));
    const mockItems = mockData.cart_items_tbl
      .filter((item) => item.cart_id === DEFAULT_CART_ID)
      .map((item) => {
        const product = productById.get(item.product_id);
        if (!product) return null;
        return {
          cart_item_id: item.cart_item_id,
          product_id: product.product_id,
          product_name: product.product_name,
          product_img: product.product_img,
          price: Number(product.price),
          quantity: item.quantity,
          seller_id: 1,
          seller_name: 'Admin Store',
          stock: product.avail_stocks,
        };
      })
      .filter(Boolean);
    syncCart(mockItems);
  }, [syncCart]);

  const loadCart = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      syncCart([]);
      return;
    }

    try {
      const response = await axios.get('/api/cart');
      syncCart(response.data?.items ?? []);
    } catch (error) {
      console.error('Failed to load cart', error);
      if (USE_MOCK_FALLBACK) {
        hydrateFromMock();
      }
    }
  }, [hydrateFromMock, syncCart]);

  const addToCart = useCallback(
    async (product, quantity) => {
      if (!product || quantity <= 0) {
        return;
      }

      try {
        const response = await axios.post('/api/cart/items', {
          product_id: product.product_id,
          quantity,
        });
        syncCart(response.data?.items ?? []);
      } catch (error) {
        console.error('Failed to add to cart', error);
        if (!USE_MOCK_FALLBACK) {
          throw error;
        }

        const cap = product.stock ?? product.avail_stocks ?? quantity;
        const next = rawItems.map((item) => ({ ...item }));
        const existing = next.find((item) => item.product_id === product.product_id);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + quantity, cap);
        } else {
          next.push({
            cart_item_id: Date.now(),
            product_id: product.product_id,
            product_name: product.product_name,
            product_img: product.product_img,
            price: Number(product.price),
            quantity: Math.min(quantity, cap),
            seller_id: 1,
            seller_name: 'Admin Store',
            stock: cap,
          });
        }
        syncCart(next);
      }
    },
    [rawItems, syncCart]
  );

  const updateQuantity = useCallback(
    async (productId, newQty) => {
      try {
        if (newQty <= 0) {
          const response = await axios.delete(`/api/cart/items/${productId}`);
          syncCart(response.data?.items ?? []);
          return;
        }
        const response = await axios.put(`/api/cart/items/${productId}`, { quantity: newQty });
        syncCart(response.data?.items ?? []);
      } catch (error) {
        console.error('Failed to update cart quantity', error);
        if (!USE_MOCK_FALLBACK) {
          throw error;
        }
        const next = rawItems.map((item) => ({ ...item }));
        const entry = next.find((item) => item.product_id === productId);
        if (!entry) {
          return;
        }
        if (newQty <= 0) {
          syncCart(next.filter((item) => item.product_id !== productId));
          return;
        }
        entry.quantity = newQty;
        syncCart(next);
      }
    },
    [rawItems, syncCart]
  );

  const clearCart = useCallback(async () => {
    try {
      await axios.delete('/api/cart');
    } catch (error) {
      console.error('Failed to clear cart', error);
    }
    syncCart([]);
  }, [syncCart]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  return (
    <CartContext.Provider value={{ cartBySeller, addToCart, updateQuantity, loadCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
