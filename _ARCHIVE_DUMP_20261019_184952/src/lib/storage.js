
import { supabase } from './supabase';

const BUCKET = 'menu-images';

export async function uploadImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}. ${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteImage(url) {
  if (!url) return;
  const path = url.split('/').pop();
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
