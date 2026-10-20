import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext(null);
const STORAGE_KEY = 'ceekay-store';

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function StoreProvider({ children }) {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('stores').select('*').order('created_at');
      
      if (data && data.length > 0) {
        setStores(data);
        
        // Check if the ID saved in local storage actually exists in the new data
        const savedId = localStorage.getItem(STORAGE_KEY);
        const validStore = data.find(s => s.id === savedId);

        if (validStore) {
          setStoreId(validStore.id);
        } else {
          // If it's stale or missing, default to the first store
          setStoreId(data[0].id);
          localStorage.setItem(STORAGE_KEY, data[0].id);
        }
      }
      setLoading(false);
    })();
  }, []);

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