import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * Subscribes to menu_items UPDATEs and invokes onMenuChange(updatedRow)
 * whenever stock or availability changes. Callback identity is stable
 * across renders so the channel is never torn down unnecessarily.
 */
export function useInventorySync(onMenuChange) {
  const cbRef = useRef(onMenuChange);
  useEffect(() => { cbRef.current = onMenuChange; });

  useEffect(() => {
    const channel = supabase
      .channel('inventory-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'menu_items' },
        ({ new: row }) => cbRef.current?.(row)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
}