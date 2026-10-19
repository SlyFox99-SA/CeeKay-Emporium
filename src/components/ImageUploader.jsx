import { useRef, useState } from 'react';
import { UploadCloud, X, RefreshCw, Loader2 } from 'lucide-react';
import { uploadImage, deleteImageByUrl, validateImage } from '../lib/storage';
import { compressImage } from '../lib/imageUtils';

export default function ImageUploader({ value, onChange, folder = 'menu' }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) { setError(validationError); return; }

    setError('');
    setBusy(true);
    try {
      // 1. Compress the image
      const compressedFile = await compressImage(file);
      // 2. Upload the compressed version
      const url = await uploadImage(compressedFile, folder);
      onChange(url);
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!dragging) setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const openPicker = () => inputRef.current?.click();

  const onInput = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const remove = async () => {
    if (!value) return;
    if (!confirm('Remove this image?')) return;
    setBusy(true);
    try {
      await deleteImageByUrl(value);
      onChange('');
    } catch (e) {
      setError(e.message || 'Remove failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="image-uploader" style={{ marginTop: '8px' }}>
      <input ref={inputRef} type="file" accept="image/*" onChange={onInput} hidden />

      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--ck-cream)', padding: '12px', borderRadius: '16px', border: '1px solid var(--ck-border)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <button type="button" onClick={openPicker} disabled={busy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'white', border: '1px solid var(--ck-border)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Replace
            </button>
            <button type="button" onClick={remove} disabled={busy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'rgba(229, 57, 53, 0.1)', color: 'var(--ck-achaar-red)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={busy ? undefined : openPicker}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{ border: `2px dashed ${dragging ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, borderRadius: '16px', padding: '32px 20px', textAlign: 'center', cursor: busy ? 'wait' : 'pointer', background: dragging ? 'var(--ck-cream)' : 'white', transition: 'all 0.2s' }}
        >
          {busy ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--ck-brand-deep)' }}>
              <Loader2 size={28} className="spin" />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Compressing & Uploading...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--ck-ink-soft)' }}>
              <UploadCloud size={28} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ck-ink)' }}>Drop an image here</div>
              <div style={{ fontSize: '12px' }}>or browse · JPG, PNG · max 10 MB</div>
            </div>
          )}
        </div>
      )}
      {error && <div style={{ color: 'var(--ck-achaar-red)', fontSize: '13px', marginTop: '8px' }}>{error}</div>}
    </div>
  );
}