import { supabase, getDeviceId } from '../lib/supabase';

const PROFILE_KEY = 'ceekay-customer';

export function getProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; }
  catch { return null; }
}

export function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }
  catch {}
}

export async function getHistory() {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];

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

export async function getLastOrder() {
  const h = await getHistory();
  return h.length > 0 ? h[0] : null;
}

/* ── LEGACY STUBS (Kept so imports don't break) ── */
export function recordOrder(_order) { /* Supabase handles this now */ }
export function updateHistoryStatus(_orderId, _status) { /* Supabase handles this now */ }

/* ── LOYALTY ── */
export async function getLoyaltyProgress() {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('loyalty')
    .select('kotas_count')
    .eq('device_id', deviceId)
    .maybeSingle();

  const count = data?.kotas_count || 0;
  const threshold = 5;
  
  return {
    count,
    threshold,
    slotsFilled: count % threshold,
    rewardReady: count >= threshold,
    rewardsAvailable: Math.floor(count / threshold),
  };
}

export async function redeemLoyalty() {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from('loyalty')
    .select('kotas_count')
    .eq('device_id', deviceId)
    .single();
    
  if (!data || data.kotas_count < 5) throw new Error("Not enough points");

  const newCount = data.kotas_count - 5;
  
  const { error } = await supabase
    .from('loyalty')
    .update({ kotas_count: newCount, last_updated: new Date().toISOString() })
    .eq('device_id', deviceId);

  if (error) throw error;
  return true;
}