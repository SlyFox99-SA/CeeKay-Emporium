import { supabase } from './supabase';

export async function uploadImage(file, folder = 'menu') {
  try {
    // 1. Create a safe, unique filename
    const fileExt = file.name.split('.').pop();
    const safeName = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${Date.now()}-${safeName}.${fileExt}`;
    const filePath = `${fileName}`; // Supabase 'from' already scopes to the bucket

    // 2. Upload with explicit parameters to avoid 400 errors
    const { data, error } = await supabase.storage
      .from('menu') // Ensure this matches your bucket name exactly
      .upload(filePath, file, {
        cacheControl: '3600',       // Must be a string
        contentType: file.type,     // e.g., 'image/jpeg'
        upsert: true                // Prevents 'Asset Already Exists' 400 errors
      });

    if (error) throw error;

    // 3. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('menu')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    throw new Error(err.message || 'Failed to upload image.');
  }
}

export async function deleteImageByUrl(url) {
  try {
    const path = url.split('/').pop(); 
    const { error } = await supabase.storage.from('menu').remove([path]);
    if (error) throw error;
  } catch (err) {
    console.error('Delete failed:', err);
    throw new Error(err.message || 'Failed to delete image.');
  }
}

export function validateImage(file) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > MAX_SIZE) return 'Image must be smaller than 5MB.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, and WEBP are allowed.';
  return null;
}