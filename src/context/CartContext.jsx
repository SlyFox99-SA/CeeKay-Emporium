/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'ceekay-cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, options = {}) => {
    const { qty = 1, modifiers = [], itemNote = '' } = options;
    const modString = modifiers.map(m => `${m.id}-${m.qty}`).sort().join('|');
    const lineKey = `${item.id}-${modString}-${itemNote}`;

    setCart(prev => {
      const existing = prev.find(line => line.lineKey === lineKey);
      if (existing) {
        return prev.map(line => line.lineKey === lineKey ? { ...line, qty: line.qty + qty } : line);
      }
      
      const modsTotal = modifiers.reduce((sum, m) => sum + (Number(m.sell_price) * m.qty), 0);
      const finalPrice = Number(item.price) + modsTotal;

      return [...prev, {
        ...item,
        price: finalPrice,
        qty,
        modifiers,
        itemNote,
        lineKey
      }];
    });
  };

  const updateItem = (oldLineKey, item, options) => {
    setCart(prev => {
      const withoutOld = prev.filter(line => line.lineKey !== oldLineKey);
      
      const { qty = 1, modifiers = [], itemNote = '' } = options;
      const modString = modifiers.map(m => `${m.id}-${m.qty}`).sort().join('|');
      const newLineKey = `${item.id}-${modString}-${itemNote}`;

      const existingNew = withoutOld.find(line => line.lineKey === newLineKey);
      if (existingNew) {
        return withoutOld.map(line => line.lineKey === newLineKey ? { ...line, qty: line.qty + qty } : line);
      }

      const modsTotal = modifiers.reduce((sum, m) => sum + (Number(m.sell_price) * m.qty), 0);
      const finalPrice = Number(item.price) + modsTotal;

      return [...withoutOld, {
        ...item,
        price: finalPrice,
        qty,
        modifiers,
        itemNote,
        lineKey: newLineKey
      }];
    });
  };

  const changeQty = (key, delta) => {
    setCart(prev => prev.map(line => {
      if (line.lineKey === key) {
        return { ...line, qty: Math.max(1, line.qty + delta) };
      }
      return line;
    }));
  };

  const removeItem = (key) => setCart(prev => prev.filter(line => line.lineKey !== key));
  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, line) => sum + (line.price * line.qty), 0);
  const count = cart.reduce((sum, line) => sum + line.qty, 0);

  const lineKey = (line) => line.lineKey;

  return (
    <CartContext.Provider value={{ cart, addToCart, updateItem, changeQty, removeItem, clearCart, total, count, lineKey }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
