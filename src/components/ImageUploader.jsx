import { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Loader2 } from 'lucide-react';
import { uploadImage, deleteImageByUrl, validateImage } from '../lib/storage';

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
      const url = await uploadImage(file, folder);
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
    <div className="image-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={onInput}
        hidden
      />

      {value ? (
        <div className="image-uploader-preview">
          <div className="image-uploader-preview-img">
            <img src={value} alt="Preview" />
          </div>
          <div className="image-uploader-preview-actions">
            <button type="button" className="image-uploader-action" onClick={openPicker} disabled={busy}>
              <RefreshCw size={14} /> Replace
            </button>
            <button type="button" className="image-uploader-action image-uploader-action-danger" onClick={remove} disabled={busy}>
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-uploader-drop ${dragging ? 'dragging' : ''} ${busy ? 'busy' : ''}`}
          onClick={busy ? undefined : openPicker}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {busy ? (
            <>
              <Loader2 size={28} className="image-uploader-spin" />
              <div className="image-uploader-title">Uploading…</div>
            </>
          ) : (
            <>
              <UploadCloud size={28} />
              <div className="image-uploader-title">Drop an image here</div>
              <div className="image-uploader-sub">or <span className="image-uploader-link">browse</span> · JPG, PNG, WEBP, SVG · max 3 MB</div>
            </>
          )}
        </div>
      )}

      {error && <div className="image-uploader-error">{error}</div>}
    </div>
  );
}