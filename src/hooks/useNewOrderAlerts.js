import { useEffect, useRef, useState } from 'react';
import { playChime, primeAudio } from '../lib/chime';

const PREF_KEY = 'ceekay-kitchen-alerts';

export function useNewOrderAlerts(orders) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(PREF_KEY) === 'true'; }
    catch { return false; }
  });

  const [permission, setPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const prevIdsRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, String(enabled)); } catch {}
    if (enabled) primeAudio();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setPermission(p));
    }
  }, [enabled]);

  useEffect(() => {
    const ids = orders.map(o => o.id);
    const prev = prevIdsRef.current;

    if (prev === null) {
      prevIdsRef.current = ids;
      return;
    }

    const newOrders = orders.filter(o => !prev.includes(o.id) && o.status === 'placed');
    prevIdsRef.current = ids;

    if (newOrders.length === 0) return;

    if (enabled) {
      playChime().catch(() => {});
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        newOrders.forEach(o => {
          try {
            const notif = new Notification(`New order #${o.id}`, {
              body: `${o.customer?.name || 'Guest'} · ${o.items.length} item${o.items.length > 1 ? 's' : ''} · R${o.total.toFixed(2)}`,
              tag: o.id,
            });
            notif.onclick = () => { window.focus(); notif.close(); };
          } catch {}
        });
      }
    }
  }, [orders, enabled]);

  useEffect(() => {
    const placedCount = orders.filter(o => o.status === 'placed').length;
    document.title = placedCount > 0
      ? `(${placedCount}) Kitchen — CeeKay`
      : 'Kitchen — CeeKay Emporium';
  }, [orders]);

  useEffect(() => () => { document.title = 'CeeKay Emporium'; }, []);

  return { enabled, setEnabled, permission };
}
