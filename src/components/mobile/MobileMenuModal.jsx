import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, ArrowLeft } from 'lucide-react';
import MobileImageUploader from './MobileImageUploader';
import { useHaptics } from '../../hooks/useHaptics';

export default function MobileMenuModal({ item, onClose, onSave }) {
  const haptics = useHaptics();
  const [form, setForm] = useState({ 
    ...item,
    stock_quantity: item.stock_quantity ?? '',
    manually_sold_out: item.manually_sold_out ?? false,
    available: item.available ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    haptics.success();
    setSaving(true);
    const payload = {
      ...form,
      stock_quantity: form.stock_quantity === '' ? null : Number(form.stock_quantity),
      price: Number(form.price)
    };
    await onSave(payload);
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

        <div className="m-modal-body" style={{ background: '#f8f9fa', paddingBottom: '100px' }}>
          
          <div className="m-form-section" style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <label className="m-field" style={{ display: 'block', marginBottom: '16px' }}>
              <span className="m-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Name</span>
              <input 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)' }}
                value={form.name || ''} 
                onChange={e => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} 
              />
            </label>
            
            <label className="m-field" style={{ display: 'block', marginBottom: '16px' }}>
              <span className="m-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Price (R)</span>
              <input 
                type="number" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)' }}
                value={form.price || ''} 
                onChange={e => setForm({ ...form, price: e.target.value })} 
              />
            </label>
            
            <label className="m-field" style={{ display: 'block', marginBottom: '16px' }}>
              <span className="m-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Category</span>
              <select 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)' }}
                value={form.category || 'kota'} 
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="kota">Kota</option>
                <option value="drink">Drink</option>
              </select>
            </label>
            
            <label className="m-field" style={{ display: 'block' }}>
              <span className="m-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Description</span>
              <textarea 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)', minHeight: '80px' }}
                value={form.desc || ''} 
                onChange={e => setForm({ ...form, desc: e.target.value })} 
              />
            </label>
          </div>

          <div className="m-form-section" style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div className="m-section-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '12px' }}>Image</div>
            <MobileImageUploader 
              value={form.image} 
              onChange={url => setForm({ ...form, image: url })} 
            />
          </div>

          <div className="m-form-section" style={{ background: 'white', borderRadius: '16px', padding: '20px' }}>
            <div className="m-section-label" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '12px' }}>Inventory & Status</div>
            
            <label className="m-field" style={{ display: 'block', marginBottom: '16px' }}>
              <span className="m-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Stock Quantity (blank = unlimited)</span>
              <input 
                type="number" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--ck-border)' }}
                value={form.stock_quantity} 
                onChange={e => setForm({ ...form, stock_quantity: e.target.value })} 
                placeholder="e.g. 50"
              />
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input type="checkbox" checked={form.manually_sold_out} onChange={e => setForm({ ...form, manually_sold_out: e.target.checked })} style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Manually mark as Sold Out</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Visible on Menu</span>
            </label>
          </div>

        </div>
      </motion.div>
    </div>
  );
}