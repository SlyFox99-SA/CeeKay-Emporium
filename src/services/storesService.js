import { supabase } from '../lib/supabase';

export async function getAllStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function saveStore(store) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(store.id);
  
  const payload = {
    name: store.name || 'CeeKay Emporium',
    branch: store.branch || '',
    address: store.address || '',
    whatsapp: store.whatsapp || '',
    email: store.email || '',
    hours_label: store.hours_label || '',
    coming_soon: !!store.coming_soon,
    latitude: store.latitude ? Number(store.latitude) : null,
    longitude: store.longitude ? Number(store.longitude) : null,
    maps_link: store.maps_link || null, // ADDED
  };

  if (isUUID) {
    const { error } = await supabase.from('stores').update(payload).eq('id', store.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('stores').insert([payload]);
    if (error) throw error;
  }
  return true;
}

export async function updateStore(id, patch) {
  return saveStore({ ...patch, id });
}

export async function createStore(store) {
  return saveStore({ ...store, id: 'new' });
}

export async function deleteStore(id) {
  await supabase.from('orders').delete().eq('store_id', id);
  const { error } = await supabase.from('stores').delete().eq('id', id);
  if (error) throw error;
  return true;
}