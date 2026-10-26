 
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { playChime } from '../lib/chime';

export function useNewOrderAlerts(initialEnabled = true) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const enabledRef = useRef(initialEnabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const channel = supabase
      .channel('kitchen-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          if (!enabledRef.current) return;
          
          try {
            playChime();
          } catch (err) {
            console.warn('Audio blocked by browser', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { enabled, setEnabled, toggle: () => setEnabled(e => !e) };
}
