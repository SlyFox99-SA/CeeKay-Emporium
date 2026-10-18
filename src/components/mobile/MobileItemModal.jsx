import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Check, AlertCircle, ShoppingBag } from 'lucide-react';
import ItemImage from '../ItemImage';
import SoldOutBadge from './SoldOutBadge';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';
import { useHaptics } from '../../hooks/useHaptics';

export default function MobileItemModal({ item, onClose, onConfirm }) {
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();

  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [selectedMods, setSelectedMods] = useState([]);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (item) document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [item]);

  useEffect(() => {
    if (!item) return;
    setQty(1); setNote(''); setSelectedMods([]); setIsAdded(false);
  }, [item?.id]);

  if (!item) return null;
  const isSoldOut = item.available === false;

  const toggleMod = (mod) => {
    haptics.light();
    setSelectedMods(prev => prev.find(m => m.id === mod.id) ? prev.filter(m => m.id !== mod.id) : [...prev, mod]);
  };

  const basePrice = Number(item.price);
  const modsTotal = selectedMods.reduce((sum, mod) => sum + Number(mod.sell_price), 0);
  const subtotal = (basePrice + modsTotal) * qty;

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
        <div className="m-modal-header" {...swipeProps} style={{ touchAction: 'none', justifyContent: 'center' }}>
          <div className="m-sheet-handle" />
        </div>

        <div className="m-modal-body">
          <div className="m-modal-photo-wrapper" style={{ opacity: isSoldOut ? 0.5 : 1 }}>
            <ItemImage src={item.image} alt={item.name} />
            {isSoldOut && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SoldOutBadge /></div>}
          </div>

          <div className="m-modal-meta">
            <div className="m-modal-title-row">
              <h2 className="m-modal-name">{item.name}</h2>
              <div className="m-modal-price">R {basePrice.toFixed(2)}</div>
            </div>
            {item.desc && <p className="m-modal-desc">{item.desc}</p>}

            {item.available_modifiers && item.available_modifiers.length > 0 && !isSoldOut && (
              <>
                <div className="m-modal-divider" />
                <div className="m-modal-section-title">Make it a Beast</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {item.available_modifiers.map(mod => {
                    const isSelected = selectedMods.find(m => m.id === mod.id);
                    return (
                      <button key={mod.id} onClick={() => toggleMod(mod)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${isSelected ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, background: isSelected ? 'var(--ck-cream)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <span style={{ fontWeight: 600, color: 'var(--ck-ink)', fontSize: '14px' }}>{mod.name}</span>
                        <span style={{ fontWeight: 700, color: 'var(--ck-brand-deep)', fontSize: '14px' }}>+ R{mod.sell_price}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {!isSoldOut && (
            <div className="m-modal-note-container">
              <div className="m-modal-section-title">Add a note (optional)</div>
              <textarea className="m-modal-note" placeholder="e.g. extra crispy..." value={note} onChange={e => setNote(e.target.value)} rows={3} />
            </div>
          )}
        </div>

        <div className="m-modal-foot">
          {isSoldOut ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '12px', color: 'var(--ck-achaar-red)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AlertCircle size={20} /> Sorry, this item is currently sold out.
            </div>
          ) : (
            <>
              <div className="m-modal-qty">
                <button className="m-qty-btn" onClick={() => { haptics.light(); setQty(q => Math.max(1, q - 1)); }} disabled={qty <= 1 || isAdded}><Minus size={16} /></button>
                <span className="m-qty-val">{qty}</span>
                <button className="m-qty-btn" onClick={() => { haptics.light(); setQty(q => Math.min(20, q + 1)); }} disabled={isAdded}><Plus size={16} /></button>
              </div>
              <button className="m-modal-add-btn" onClick={handleConfirm} style={{ background: isAdded ? 'var(--ck-green)' : 'var(--ck-brand-deep)', transition: 'background 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isAdded ? (<><Check size={20} /> Added!</>) : (<><ShoppingBag size={18} /><span className="m-add-text">Add</span><span className="m-add-price">R {subtotal.toFixed(2)}</span></>)}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}