 
import { supabase } from '../lib/supabase';

export async function validatePromo(code) {
  if (!code) return null;
  
  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .maybeSingle(); // FIXED: Gracefully handles invalid codes without 406

  if (error || !data) return null;
  return data;
}
