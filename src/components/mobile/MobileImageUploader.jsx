
import { useState, useRef } from 'react';
import { Camera, X, Loader2, UploadCloud } from 'lucide-react';
import { uploadImage } from '../../lib/storage';

export default function MobileImageUploader({ value, onChange }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      console.error('Upload failed', err);
      console.error('Failed to upload image. Make sure you are an admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="m-image-uploader">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      
      {value ? (
        <div className="m-image-preview">
          <img src={value} alt="Preview" />
          <button className="m-image-remove" onClick={() => onChange('')} type="button">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button 
          className="m-image-upload-btn" 
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          type="button"
        >
          {loading ? <Loader2 size={24} className="spin" /> : <Camera size={24} />}
          <span>{loading ? 'Uploading...' : 'Take Photo or Upload'}</span>
        </button>
      )}
    </div>
  );
}
