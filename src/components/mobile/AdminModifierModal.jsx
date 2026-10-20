import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateItemModifiers } from '../../services/menuService';
import { useHaptics } from '../../hooks/useHaptics';

export default function AdminModifierModal({ item, modifiers, onClose, onSave }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const haptics = useHaptics();

  useEffect(() => {
    const fetchCurrentMods = async () => {
      const { data } = await supabase
        .from('menu_item_modifiers')
        .select('modifier_id')
        .eq('menu_item_id', item.id);
      
      if (data) {
        setSelectedIds(data.map(d => d.modifier_id));
      }
      setLoading(false);
    };
    fetchCurrentMods();
  }, [item.id]);

  const toggle = (id) => {
    haptics.light();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    haptics.success();
    try {
      await updateItemModifiers(item.id, selectedIds);
      onSave();
    } catch (err) {
      alert('Failed to save modifiers.');
      setSaving(false);
    }
  };

  return (
    <div className="m-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <motion.div 
        className="m-modal-sheet" 
        onClick={e => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ height: '80dvh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--ck-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '22px', margin: 0, color: 'var(--ck-ink)' }}>Add-ons</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ck-ink-soft)' }}>for {item.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--ck-cream)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--ck-cream)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>Loading modifiers...</div>
          ) : modifiers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>No modifiers found in the database. Add them in Supabase.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {modifiers.map(mod => {
                const isSelected = selectedIds.includes(mod.id);
                return (
                  <div 
                    key={mod.id} 
                    onClick={() => toggle(mod.id)}
                    style={{ 
                      background: 'white', padding: '16px', borderRadius: '16px', 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: `2px solid ${isSelected ? 'var(--ck-brand-deep)' : 'transparent'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ck-ink)' }}>{mod.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--ck-brand-deep)', fontWeight: 700, marginTop: '2px' }}>+ R{mod.sell_price}</div>
                    </div>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', 
                      background: isSelected ? 'var(--ck-brand-deep)' : 'var(--ck-cream)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? 'white' : 'transparent'
                    }}>
                      <Check size={16} strokeWidth={3} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', background: 'white', borderTop: '1px solid var(--ck-border)' }}>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '99px', border: 'none', fontWeight: 800, fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Add-ons'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}