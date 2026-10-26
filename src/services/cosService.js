 
import { supabase } from '../lib/supabase';

export async function getIngredients() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addIngredient(ingredient) {
  // Use upsert: If the name exists, it updates the price and yield.
  const { error } = await supabase
    .from('ingredients')
    .upsert([ingredient], { onConflict: 'name' });
  if (error) throw error;
  return true;
}

export async function addBulkIngredients(ingredients) {
  const { error } = await supabase
    .from('ingredients')
    .upsert(ingredients, { onConflict: 'name' });
  if (error) throw error;
  return true;
}

export async function deleteIngredient(id) {
  const { error } = await supabase.from('ingredients').delete().eq('id', id);
  if (error) throw error;
  return true;
}
