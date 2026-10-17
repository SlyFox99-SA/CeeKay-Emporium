import { supabase } from '../lib/supabase';

export async function getAllStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function updateStore(id, patch) {
  const { data, error } = await supabase
    .from('stores')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createStore(store) {
  const { data, error } = await supabase
    .from('stores')
    .insert(store)
    .select()
    .single();
  if (error) throw error;
  return data;
}