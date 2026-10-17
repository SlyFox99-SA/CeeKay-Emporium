import { createContext, useContext, useEffect, useState } from 'react';
import { STORES, getStoreStatus } from '../data/stores';

const StoreContext = createContext(null);
const STORAGE_KEY = 'ceekay-store';

export function StoreProvider({ children }) {
  const [storeId, setStoreId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (storeId) localStorage.setItem(STORAGE_KEY, storeId);
  }, [storeId]);

  const stores = STORES.map(s => ({ ...s, status: getStoreStatus(s) }));
  const store = stores.find(s => s.id === storeId) || null;

  const selectStore = (id) => setStoreId(id);
  const clearStore = () => {
    setStoreId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <StoreContext.Provider value={{ store, stores, selectStore, clearStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
