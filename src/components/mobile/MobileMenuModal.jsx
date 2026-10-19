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
    <div className="m-modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'flex-end' }}>
      <motion.div 
        className="m-modal-sheet" 
        style={{ height: '100dvh', width: '100%', background: 'var(--ck-cream)', borderRadius: 0, display: 'flex', flexDirection: 'column' }}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', paddingTop: 'calc(16px + env(safe-area-inset-top))', background: 'white', borderBottom: '1px solid var(--ck-border)' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} color="var(--ck-ink)" />
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>
            {item.id ? 'Edit Item' : 'New Item'}
          </h2>
          <button onClick={handleSave} disabled={saving} style={{ background: 'var(--ck-brand-deep)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '...' : <><Save size={16} /> Save</>}
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
          
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Name</span>
              <input 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }}
                value={form.name || ''} 
                onChange={e => setForm({ ...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} 
              />
            </label>
            
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Price (R)</span>
              <input 
                type="number" 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }}
                value={form.price || ''} 
                onChange={e => setForm({ ...form, price: e.target.value })} 
              />
            </label>
            
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Category</span>
              <select 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none', background: 'white' }}
                value={form.category || 'kota'} 
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="kota">Kota</option>
                <option value="drink">Drink</option>
              </select>
            </label>
            
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Description</span>
              <textarea 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                value={form.desc || ''} 
                onChange={e => setForm({ ...form, desc: e.target.value })} 
              />
            </label>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid var(--ck-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '12px' }}>Image</div>
            <MobileImageUploader 
              value={form.image} 
              onChange={url => setForm({ ...form, image: url })} 
            />
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--ck-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '12px' }}>Inventory & Status</div>
            
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}>Stock Quantity (blank = unlimited)</span>
              <input 
                type="number" 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '15px', outline: 'none' }}
                value={form.stock_quantity} 
                onChange={e => setForm({ ...form, stock_quantity: e.target.value })} 
                placeholder="e.g. 50"
              />
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.manually_sold_out} onChange={e => setForm({ ...form, manually_sold_out: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: 'var(--ck-brand-deep)' }} />
              <span style={{ fontSize: '15px', fontWeight: 600 }}>Manually mark as Sold Out</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: 'var(--ck-brand-deep)' }} />
              <span style={{ fontSize: '15px', fontWeight: 600 }}>Visible on Menu</span>
            </label>
          </div>

        </div>
      </motion.div>
    </div>
  );
}