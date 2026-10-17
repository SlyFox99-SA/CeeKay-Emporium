import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, ArrowLeft } from 'lucide-react';
import MobileImageUploader from './MobileImageUploader';
import { useHaptics } from '../../hooks/useHaptics';

export default function MobileMenuModal({ item, onClose, onSave }) {
  const haptics = useHaptics();
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    haptics.success();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="m-modal-overlay" style={{ zIndex: 9999 }}>
      <motion.div 
        className="m-modal-sheet" 
        style={{ height: '100dvh', borderRadius: 0 }}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="m-modal-header" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
          <button className="m-modal-back" onClick={onClose}><ArrowLeft size={20} /></button>
          <h2 className="m-modal-title">{item.id ? 'Edit Item' : 'New Item'}</h2>
          <button className="m-modal-save" onClick={handleSave} disabled={saving}>
            {saving ? '...' : <Save size={20} />}
          </button>
        </div>

        <div className="m-modal-body" style={{ background: '#f8f9fa' }}>
          <div className="m-form-section">
            <label className="m-field">
              <span className="m-label">Name</span>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} />
            </label>
            <label className="m-field">
              <span className="m-label">Price (R)</span>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </label>
            <label className="m-field">
              <span className="m-label">Category</span>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="kota">Kota</option>
                <option value="drink">Drink</option>
              </select>
            </label>
            <label className="m-field">
              <span className="m-label">Description</span>
              <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3} />
            </label>
          </div>

          <div className="m-form-section">
            <div className="m-section-label">Image</div>
            <MobileImageUploader 
              value={form.image} 
              onChange={url => setForm({ ...form, image: url })} 
            />
          </div>

          <div className="m-form-section">
            <div className="m-section-label">Options</div>
            <label className="m-checkbox-row">
              <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
              <span>Available for ordering</span>
            </label>
            <label className="m-checkbox-row">
              <input type="checkbox" checked={form.popular} onChange={e => setForm({ ...form, popular: e.target.checked })} />
              <span>Mark as Popular</span>
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );
}