import { supabase } from '../lib/supabase';

export async function getAllStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function saveStore(store) {
  const { error } = await supabase.rpc('save_store', {
    p_id: store.id || 'new',
    p_name: store.name || 'CeeKay Emporium',
    p_branch: store.branch || '',
    p_address: store.address || '',
    p_whatsapp: store.whatsapp || '',
    p_email: store.email || '',
    p_hours_label: store.hours_label || '',
    p_coming_soon: !!store.coming_soon,
    p_latitude: store.latitude ? String(store.latitude) : '',
    p_longitude: store.longitude ? String(store.longitude) : ''
  });
  if (error) throw error;
  return true;
}

export async function updateStore(id, patch) {
  return saveStore({ ...patch, id });
}

export async function createStore(store) {
  return saveStore({ ...store, id: 'new' });
}

export async function deleteStore(id) {
  const { error } = await supabase.rpc('force_delete_store', { p_store_id: id });
  if (error) throw error;
  return true;
}