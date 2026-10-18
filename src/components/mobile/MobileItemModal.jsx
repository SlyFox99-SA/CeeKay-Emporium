import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Check, AlertCircle } from 'lucide-react';
import SoldOutBadge from './SoldOutBadge';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';
import { useHaptics } from '../../hooks/useHaptics';
import ModifierSelector from './item-modal/ModifierSelector';
import PreferenceSelector from './item-modal/PreferenceSelector';

export default function MobileItemModal({ item, onClose, onConfirm }) {
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();

  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [selectedMods, setSelectedMods] = useState([]);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!item) return;
    setQty(1); setNote(''); setSelectedMods([]); setIsAdded(false);
  }, [item?.id]);

  if (!item) return null;
  const isSoldOut = item.available === false;
  const imageUrl = (item.image && item.image.length > 5) ? item.image : "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop";

  const extras = item.available_modifiers?.filter(m => m.category === 'extra') || [];
  const prefs = item.available_modifiers?.filter(m => m.category === 'preference') || [];

  const updateMod = (mod, action) => {
    haptics.light();
    setSelectedMods(prev => {
      const existing = prev.find(m => m.id === mod.id);
      if (action === 'add') {
        if (existing) {
          if ((existing.qty || 1) >= 2) return prev;
          return prev.map(m => m.id === mod.id ? { ...m, qty: (m.qty || 1) + 1 } : m);
        }
        return [...prev, { ...mod, qty: 1 }];
      } else {
        if (!existing) return prev;
        if ((existing.qty || 1) === 1) return prev.filter(m => m.id !== mod.id);
        return prev.map(m => m.id === mod.id ? { ...m, qty: (m.qty || 1) - 1 } : m);
      }
    });
  };

  const togglePref = (pref) => {
    haptics.light();
    setSelectedMods(prev => {
      if (pref.group_name === 'Sauces') {
        const filtered = prev.filter(m => {
           const existingMod = item.available_modifiers.find(x => x.id === m.id);
           return !existingMod || existingMod.group_name !== 'Sauces';
        });
        const isAlreadySelected = prev.some(m => m.id === pref.id);
        if (isAlreadySelected) return filtered;
        return [...filtered, { ...pref, qty: 1 }];
      }
      const existing = prev.find(m => m.id === pref.id);
      if (existing) return prev.filter(m => m.id !== pref.id);
      return [...prev, { ...pref, qty: 1 }];
    });
  };

  const basePrice = Number(item.price) || 0;
  const modsTotal = selectedMods.reduce((sum, mod) => sum + (Number(mod.sell_price || 0) * (mod.qty || 1)), 0);
  const subtotal = (basePrice + modsTotal) * (qty || 1);

  const handleConfirm = () => {
    if (isSoldOut || isAdded) return;
    haptics.success();
    setIsAdded(true);
    onConfirm(item, { qty, modifiers: selectedMods, itemNote: note });
    setTimeout(() => { onClose(); }, 600);
  };

  return (
    <div className="m-modal-overlay" onClick={onClose}>
      <motion.div className="m-modal-sheet" onClick={e => e.stopPropagation()} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 350 }}>
        
        <div className="m-modal-header" {...swipeProps} style={{ touchAction: 'none' }}>
          <div className="m-sheet-handle" />
        </div>

        <div className="m-modal-body">
          <div style={{ width: '100%', height: '260px', background: 'var(--ck-cream)', position: 'relative' }}>
             <img src={imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             {isSoldOut && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SoldOutBadge /></div>}
          </div>

          <div style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', margin: 0, color: 'var(--ck-ink)' }}>{item.name}</h2>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>R {basePrice.toFixed(2)}</div>
            </div>
            
            {item.desc && <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--ck-ink-soft)', lineHeight: 1.5 }}>{item.desc}</p>}

            {!isSoldOut && (
              <>
                <ModifierSelector extras={extras} selectedMods={selectedMods} onUpdate={updateMod} />
                <PreferenceSelector prefs={prefs} selectedMods={selectedMods} onToggle={togglePref} />
                <div style={{ marginTop: '24px' }}>
                  <textarea style={{ width: '100%', background: 'var(--ck-cream)', border: '1px solid var(--ck-border)', borderRadius: '12px', padding: '16px', fontSize: '14px', minHeight: '80px', resize: 'none', outline: 'none' }} placeholder="Add a note (e.g. extra crispy)..." value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="m-modal-foot">
          {isSoldOut ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '12px', color: 'var(--ck-achaar-red)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AlertCircle size={20} /> Sold Out
            </div>
          ) : (
            <>
              <div className="m-qty-selector">
                <button className="m-qty-btn" onClick={() => { haptics.light(); setQty(q => Math.max(1, q - 1)); }}><Minus size={16} /></button>
                <span className="m-qty-val">{qty}</span>
                <button className="m-qty-btn" onClick={() => { haptics.light(); setQty(q => Math.min(20, q + 1)); }}><Plus size={16} /></button>
              </div>
              <button className={`m-add-btn ${isAdded ? 'added' : ''}`} onClick={handleConfirm}>
                {isAdded ? (<><Check size={20} /> Added!</>) : (`Add • R ${subtotal.toFixed(2)}`)}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}