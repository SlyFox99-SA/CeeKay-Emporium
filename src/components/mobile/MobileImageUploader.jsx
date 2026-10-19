import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { uploadImage } from '../../lib/storage';
import { compressImage } from '../../lib/imageUtils';

export default function MobileImageUploader({ value, onChange }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // 1. Compress the image
      const compressedFile = await compressImage(file);
      // 2. Upload
      const url = await uploadImage(compressedFile);
      onChange(url);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
      
      {value ? (
        <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--ck-border)' }}>
          <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={() => onChange('')} type="button" style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: 'white' }}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          type="button"
          style={{ width: '100%', height: '120px', border: '2px dashed var(--ck-border)', borderRadius: '16px', background: 'var(--ck-cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--ck-brand-deep)', cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? <Loader2 size={24} className="spin" /> : <Camera size={24} />}
          <span style={{ fontSize: '14px', fontWeight: 700 }}>{loading ? 'Compressing & Uploading...' : 'Take Photo'}</span>
        </button>
      )}
    </div>
  );
}