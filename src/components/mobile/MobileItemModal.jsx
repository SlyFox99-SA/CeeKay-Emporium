import { useEffect, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Minus, Plus, Check, AlertCircle } from 'lucide-react';
import SoldOutBadge from './SoldOutBadge';
import { useHaptics } from '../../hooks/useHaptics';
import ModifierSelector from './item-modal/ModifierSelector';
import PreferenceSelector from './item-modal/PreferenceSelector';
import ItemImage from '../ItemImage'; // IMPORT ITEMIMAGE

export default function MobileItemModal({ item, onClose, onConfirm }) {
  const haptics = useHaptics();
  const dragControls = useDragControls();

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
      const isAlreadySelected = prev.some(m => m.id === pref.id);
      if (pref.name === 'No Sauce') {
        if (isAlreadySelected) return prev.filter(m => m.id !== pref.id);
        const withoutSauces = prev.filter(m => {
           const existingMod = item.available_modifiers.find(x => x.id === m.id);
           return !existingMod || existingMod.group_name !== 'Sauces';
        });
        return [...withoutSauces, { ...pref, qty: 1 }];
      }
      if (pref.group_name === 'Sauces') {
        const withoutNoSauce = prev.filter(m => {
           const existingMod = item.available_modifiers.find(x => x.id === m.id);
           return !existingMod || existingMod.name !== 'No Sauce';
        });
        if (isAlreadySelected) return withoutNoSauce.filter(m => m.id !== pref.id);
        return [...withoutNoSauce, { ...pref, qty: 1 }];
      }
      if (isAlreadySelected) return prev.filter(m => m.id !== pref.id);
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
    <div 
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998, display: 'flex', alignItems: 'flex-end' }} 
      onClick={onClose}
    >
      <motion.div 
        style={{ width: '100%', height: '90dvh', background: 'var(--ck-cream)',borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
        onClick={e => e.stopPropagation()}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(e, info) => { if (info.offset.y > 100 || info.velocity.y > 500) onClose(); }}
      >
        <div 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px', display: 'flex', justifyContent: 'center', zIndex: 50, cursor: 'grab' }}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div style={{ width: '48px', height: '6px', background: 'rgba(255,255,255,0.8)', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: 0 }}>
          
          {/* HERO IMAGE - Now uses ItemImage to perfectly handle missing images */}
          <div style={{ width: '100%', height: '260px', background: 'var(--ck-cream)', position: 'relative' }}>
             <ItemImage src={item.image} alt={item.name} />
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
                  <textarea style={{ width: '100%', background: 'var(--ck-cream)', border: '1px solid var(--ck-border)', borderRadius: '12px', padding: '16px',fontSize: '14px', minHeight: '80px', resize: 'none', outline: 'none' }} placeholder="Add a note (e.g. extra crispy)..." value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, background: 'white', padding: '16px 20px calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--ck-border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', zIndex: 10, display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isSoldOut ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '12px', color: 'var(--ck-achaar-red)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AlertCircle size={20} /> Sold Out
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ck-cream)', borderRadius: '99px', padding: '4px', height: '56px' }}>
                <button onClick={() => { haptics.light(); setQty(q => Math.max(1, q - 1)); }} style={{ background: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Minus size={16} /></button>
                <span style={{ width: '32px', textAlign: 'center', fontWeight: 800, fontSize: '16px' }}>{qty}</span>
                <button onClick={() => { haptics.light(); setQty(q => Math.min(20, q + 1)); }} style={{ background: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Plus size={16} /></button>
              </div>
              <button onClick={handleConfirm} style={{ flex: 1, height: '56px',background: isAdded ? 'var(--ck-green)' : 'var(--ck-brand-deep)', color: 'white', borderRadius: '99px', border: 'none', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor:'pointer', boxShadow: '0 4px 12px rgba(15, 46, 74, 0.2)' }}>
                {isAdded ? (<><Check size={20} /> Added!</>) : (`Add • R ${subtotal.toFixed(2)}`)}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}