import { supabase } from '../lib/supabase';

export async function getMenu() {
  try {
    const { data: items, error } = await supabase.from('menu_items').select('*').order('category', { ascending: true });
    if (error) throw error;

    const { data: mods } = await supabase.from('modifiers').select('*');
    const { data: links } = await supabase.from('menu_item_modifiers').select('*');

    const itemsWithMods = items.map(item => {
       const itemLinks = links ? links.filter(l => String(l.menu_item_id) === String(item.id)) : [];
       const available_modifiers = itemLinks.map(l => mods.find(m => m.id === l.modifier_id)).filter(Boolean);
       return { ...item, available_modifiers };
    });

    return {
      kotas: itemsWithMods.filter(item => item.category === 'kota'),
      drinks: itemsWithMods.filter(item => item.category === 'drink')
    };
  } catch (err) {
    console.error('getMenu failed:', err);
    return { kotas: [], drinks: [] }; // Safe fallback
  }
}

export async function getAllMenu() {
  try {
    const { data, error } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getAllMenu failed:', err);
    return [];
  }
}
export async function getAllMenuItems() { return getAllMenu(); }
export async function getModifiers() {
  try {
    const { data } = await supabase.from('modifiers').select('*').eq('is_available', true);
    return data || [];
  } catch (err) { return []; }
}
export async function createMenuItem(item) {
  try {
    const { data, error } = await supabase.from('menu_items').insert(item).select().single();
    if (error) throw error;
    return data;
  } catch (err) { throw err; }
}
export async function updateMenuItem(id, updates) {
  try {
    const { data, error } = await supabase.from('menu_items').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } catch (err) { throw err; }
}
export async function deleteMenuItem(id) {
  try {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
  } catch (err) { throw err; }
}
export async function updateItemModifiers(itemId, modifierIds) {
  try {
    await supabase.from('menu_item_modifiers').delete().eq('menu_item_id', itemId);
    if (modifierIds.length > 0) {
      const inserts = modifierIds.map(modId => ({ menu_item_id: itemId, modifier_id: modId }));
      const { error } = await supabase.from('menu_item_modifiers').insert(inserts);
      if (error) throw error;
    }
  } catch (err) { throw err; }
}
export function subscribeToMenu(callback) {
  const channel = supabase
    .channel('menu-stream')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
      getMenu().then(callback);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}