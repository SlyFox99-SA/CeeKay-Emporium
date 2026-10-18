import { supabase } from '../lib/supabase';

// ==========================================
// CUSTOMER APP FUNCTIONS
// ==========================================

export async function getMenu() {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      modifiers:menu_item_modifiers(
        modifier:modifiers(*)
      )
    `)
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }

  const kotas = data.filter(item => item.category === 'kota').map(item => ({
    ...item,
    available_modifiers: item.modifiers.map(m => m.modifier)
  }));

  const drinks = data.filter(item => item.category === 'drink');

  return { kotas, drinks };
}

// ==========================================
// ADMIN PANEL FUNCTIONS
// ==========================================

// Note: We provide BOTH names to satisfy any historical imports
export async function getAllMenu() {
  const { data, error } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function getAllMenuItems() {
  return getAllMenu();
}

export async function getModifiers() {
  const { data, error } = await supabase.from('modifiers').select('*').eq('is_available', true);
  if (error) return [];
  return data;
}

export async function createMenuItem(item) {
  const { data, error } = await supabase.from('menu_items').insert(item).select().single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id, updates) {
  const { data, error } = await supabase.from('menu_items').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}