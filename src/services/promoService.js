import { supabase } from '../lib/supabase';

export async function validatePromo(code) {
  if (!code) return null;
  
  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .single();

  if (error || !data) return null;
  return data;
}