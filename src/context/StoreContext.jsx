import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext(null);
const STORAGE_KEY = 'ceekay-store';

// Validates if a string is a proper Postgres UUID
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function StoreProvider({ children }) {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // ONLY accept valid UUIDs from storage to prevent old static IDs like "benoni" from breaking the database
      return saved && isUUID(saved) ? saved : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('stores').select('*').order('created_at');
      if (data && data.length > 0) {
        setStores(data);
        if (!storeId) setStoreId(data[0].id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (storeId && isUUID(storeId)) {
      localStorage.setItem(STORAGE_KEY, storeId);
    }
  }, [storeId]);

  const store = stores.find(s => s.id === storeId) || null;

  const selectStore = (id) => setStoreId(id);
  const clearStore = () => {
    setStoreId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <StoreContext.Provider value={{ store, stores, loading, selectStore, clearStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);