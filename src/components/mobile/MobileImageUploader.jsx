import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { uploadImage, deleteImageByUrl, validateImage } from '../../lib/storage';

export default function MobileImageUploader({ value, onChange, folder = 'menu' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) { setError(validationError); return; }

    setError('');
    setBusy(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const remove = async () => {
    if (!value) return;
    if (!confirm('Remove this image?')) return;
    setBusy(true);
    try {
      await deleteImageByUrl(value);
      onChange('');
    } catch (err) {
      setError(err.message || 'Remove failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="m-image-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment" /* Opens camera directly on mobile */
        onChange={handleFile}
        hidden
      />

      {value ? (
        <div className="m-image-preview-box">
          <img src={value} alt="Preview" />
          <button className="m-image-remove-btn" onClick={remove} disabled={busy}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <button className="m-image-upload-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 size={24} className="spin" /> : <Camera size={24} />}
          <span>{busy ? 'Uploading...' : 'Tap to take photo or upload'}</span>
        </button>
      )}

      {error && <div className="m-image-error">{error}</div>}
    </div>
  );
}