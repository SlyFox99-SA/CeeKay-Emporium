const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

import { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from './StoreContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'ceekay-cart';
const STORE_KEY = 'ceekay-cart-store';

/* A cart line is unique per combination of:
   product id + removed ingredients + item note. */
function lineKey(item) {
  const removed = (item.removedIngredients || []).slice().sort().join('|');
  const note = (item.itemNote || '').trim().toLowerCase();
  return `${item.id}::${removed}::${note}`;
}

export function CartProvider({ children }) {
  const { store } = useStore();

  const [cart, setCart] = useState(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('ceekay-cart') || '[]');
    // Strict filter: Drop any items that don't have a valid Supabase UUID
    return saved.filter(item => isUUID(item.id));
  } catch {
    return [];
  }
});

  const [cartStoreId, setCartStoreId] = useState(() => {
    try { return localStorage.getItem(STORE_KEY) || null; }
    catch { return null; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (cartStoreId) localStorage.setItem(STORE_KEY, cartStoreId); }, [cartStoreId]);

  useEffect(() => {
    if (cartStoreId && store?.id && cartStoreId !== store.id) {
      setCart([]);
      setCartStoreId(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORE_KEY);
    }
  }, [store?.id, cartStoreId]);

  /* Add an item with optional qty, removed ingredients, per-item note. */
  const addToCart = (product, options = {}) => {
    const { qty = 1, removedIngredients = [], itemNote = '' } = options;
    if (store?.id) setCartStoreId(store.id);

    const line = {
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      qty,
      removedIngredients,
      itemNote: itemNote.trim(),
    };
    const key = lineKey(line);

    setCart(prev => {
      const idx = prev.findIndex(i => lineKey(i) === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...prev, line];
    });
  };

  /* Adjust qty by delta (works on line key) */
  const changeQty = (key, delta) => {
    setCart(prev => prev
      .map(i => lineKey(i) === key ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0));
  };

  /* Remove a line by key */
  const removeItem = (key) => {
    setCart(prev => prev.filter(i => lineKey(i) !== key));
  };

  /* Insert a line back (used for Undo) */
  const restoreLine = (line, atIndex = null) => {
    setCart(prev => {
      if (atIndex == null) return [...prev, line];
      const next = [...prev];
      next.splice(atIndex, 0, line);
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCartStoreId(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORE_KEY);
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, changeQty, removeItem, restoreLine, clearCart,
      total, count, lineKey,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
