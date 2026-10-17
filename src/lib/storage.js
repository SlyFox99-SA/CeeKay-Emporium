import { supabase } from './supabase';

const BUCKET = 'menu-images';

/* Upload a File object → returns the public URL */
export async function uploadImage(file, folder = 'menu') {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const base = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const path = `${folder}/${base}-${unique}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/* Delete by public URL (no-op if the URL is not in our bucket) */
export async function deleteImageByUrl(url) {
  if (!url || !url.includes(`/${BUCKET}/`)) return;
  const path = url.split(`/${BUCKET}/`)[1];
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/* Validation */
export function validateImage(file) {
  const MAX_BYTES = 3 * 1024 * 1024;
  const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!OK_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type || 'unknown'}. Use JPG, PNG, WEBP, or SVG.`;
  }
  if (file.size > MAX_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 3 MB.`;
  }
  return null;
}