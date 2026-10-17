import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    '[CeeKay] Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

export const supabase = createClient(url || 'http://localhost', key || 'noop', {
  realtime: { params: { eventsPerSecond: 5 } },
});

/* Anonymous device identity — used to retrieve a customer's own orders
   without requiring them to sign up. */
const DEVICE_KEY = 'ceekay-device-id';

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}
