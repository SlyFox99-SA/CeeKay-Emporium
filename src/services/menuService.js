import { supabase } from '../lib/supabase';

/* Map a Supabase row to the shape the storefront expects */
function fromDb(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image,
    desc: row.description,
    tag: row.tag,
    tagClass: row.tag_class,
    ribbon: row.ribbon,
    ingredients: row.ingredients || [],
    popular: row.popular,
    available: row.available,
    sortOrder: row.sort_order,
  };
}

/* ── PUBLIC ── */
export async function getMenu() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[getMenu]', error);
    return { kotas: [], drinks: [] };
  }

  const items = (data || []).map(fromDb);
  return {
    kotas: items.filter((i) => i.category === 'kota'),
    drinks: items.filter((i) => i.category === 'drink'),
  };
}

/* ── ADMIN ── */
export async function getAllMenu() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[getAllMenu]', error);
    return [];
  }
  return (data || []).map(fromDb);
}

export async function createMenuItem(item) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(toDb(item))
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function updateMenuItem(id, patch) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ ...toDb(patch), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

function toDb(item) {
  return {
    slug: item.slug,
    name: item.name,
    category: item.category,
    price: item.price,
    image: item.image,
    description: item.desc,
    tag: item.tag,
    tag_class: item.tagClass,
    ribbon: item.ribbon,
    ingredients: item.ingredients || [],
    popular: !!item.popular,
    available: item.available !== false,
    sort_order: item.sortOrder ?? 0,
  };
}
