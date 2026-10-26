 
import { supabase } from './supabase';

const BUCKET_NAME = 'menu-images';

export async function uploadImage(file, folder = 'menu') {
  try {
    // Generate a safe, unique path
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type || 'image/jpeg',
        upsert: true // ALLOW OVERWRITE to prevent 400 errors
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch {
    console.error('Upload failed:', err);
    throw new Error(err.message || 'Failed to upload image.');
  }
}

export async function deleteImageByUrl(url) {
  try {
    const path = url.split(`${BUCKET_NAME}/`).pop(); 
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) throw error;
  } catch {
    console.error('Delete failed:', err);
    throw new Error(err.message || 'Failed to delete image.');
  }
}

export function validateImage(file) {
  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > MAX_SIZE) return 'Image must be smaller than 5MB.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, and WEBP are allowed.';
  return null;
}

