import { supabase, getDeviceId } from '../lib/supabase';

const PROFILE_KEY = 'ceekay-customer';

/* ── PROFILE (stays local — it's device-scoped) ── */
export function getProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; }
  catch { return null; }
}

export function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
  catch {}
}

/* ── ORDER HISTORY (from Supabase, filtered to this device) ── */
export async function getHistory() {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[getHistory]', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    items: row.items || [],
    total: Number(row.total),
    storeBranch: row.store_branch,
    pickupTime: row.customer?.pickupTime,
    createdAt: row.created_at,
    status: row.status,
  }));
}

/* Called after createOrder succeeds — no-op now, but kept for API stability */
export function recordOrder(_order) { /* moved to Supabase via createOrder */ }

/* Update status in the local cache — no-op now, kitchen writes to Supabase directly */
export function updateHistoryStatus(_orderId, _status) { /* kitchen writes go direct to Supabase */ }

/* ── DERIVED ── */
export async function getLastOrder() {
  const h = await getHistory();
  return h.length > 0 ? h[0] : null;
}

export async function getLoyaltyProgress(threshold = 5) {
  const history = await getHistory();
  const count = history
    .flatMap((o) => o.items)
    .filter((i) => [1, 2, 3].includes(i.id))
    .reduce((sum, i) => sum + i.qty, 0);

  return {
    count,
    threshold,
    remaining: Math.max(0, threshold - (count % threshold)),
    ready: count >= threshold && count % threshold === 0 && count > 0,
    slotsFilled: count % threshold,
  };
}
