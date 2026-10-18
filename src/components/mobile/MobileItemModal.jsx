import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Check, AlertCircle, ShoppingBag } from 'lucide-react';
import ItemImage from '../ItemImage';
import SoldOutBadge from './SoldOutBadge';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';
import { useHaptics } from '../../hooks/useHaptics';


export default function MobileItemModal({ item, onClose, onConfirm, drinks = [] }) {
  const isKota = Array.isArray(item?.ingredients);
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();

  const [qty, setQty] = useState(1);
  const [removed, setRemoved] = useState([]);
  const [note, setNote] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!item) return;
    setQty(1); setRemoved([]); setNote(''); setIsAdded(false);
  }, [item?.id]);

  if (!item) return null;

  const isSoldOut = item.is_available === false;

  const toggleIngredient = (name) => {
    haptics.light();
    setRemoved(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const subtotal = item.price * qty;

  const handleConfirm = () => {
    if (isSoldOut || isAdded) return;
    haptics.success();
    setIsAdded(true);
    onConfirm(item, { qty, removedIngredients: removed, itemNote: note });
    
    // Let the user see the success state before closing
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="m-modal-overlay" onClick={onClose}>
      <motion.div 
        className="m-modal-sheet" 
        onClick={e => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
      >
        {/* Native Drag Handle (No X button) */}
        <div className="m-modal-header" {...swipeProps} style={{ touchAction: 'none', justifyContent: 'center' }}>
          <div className="m-sheet-handle" />
        </div>

        {/* Scrollable Body */}
        <div className="m-modal-body">
          
          <div className="m-modal-photo-wrapper" style={{ opacity: isSoldOut ? 0.5 : 1 }}>
            <ItemImage src={item.image} alt={item.name} />
            {isSoldOut && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SoldOutBadge />
              </div>
            )}
          </div>

          <div className="m-modal-meta">
            <div className="m-modal-title-row">
              <h2 className="m-modal-name">{item.name}</h2>
              <div className="m-modal-price">R {item.price.toFixed(2)}</div>
            </div>
            
            {item.desc && <p className="m-modal-desc">{item.desc}</p>}

            {isKota && item.ingredients.length > 0 && (
              <>
                <div className="m-modal-divider" />
                <div className="m-modal-section-title">What's on it</div>
                <div className="m-modal-ingredients">
                  {item.ingredients.map((ing, i) => {
                    const isRemoved = removed.includes(ing);
                    return (
                      <button key={i} className={`m-ingredient-toggle ${isRemoved ? 'removed' : 'kept'}`} onClick={() => toggleIngredient(ing)} disabled={isSoldOut}>
                        {isRemoved ? <Minus size={14} /> : <Check size={14} />} <span>{ing}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {isKota && !isSoldOut && (
            <div className="m-upsell-section">
              <div className="m-upsell-title">Perfect with a cold drink</div>
              <div className="m-upsell-scroll">
                {drinks.map(drink => (
                  <div key={drink.id} className="m-upsell-card" onClick={() => { haptics.light(); onConfirm(drink, { qty: 1 }); }}>
                    <div className="m-upsell-img"><ItemImage src={drink.image} alt={drink.name} /></div>
                    <div className="m-upsell-info">
                      <div className="m-upsell-name">{drink.name}</div>
                      <div className="m-upsell-price">R {drink.price}</div>
                    </div>
                    <div className="m-upsell-add"><Plus size={14} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSoldOut && (
            <div className="m-modal-note-container">
              <div className="m-modal-section-title">Add a note (optional)</div>
              <textarea className="m-modal-note" placeholder="e.g. extra crispy..." value={note} onChange={e => setNote(e.target.value)} rows={3} />
            </div>
          )}
        </div>

        {/* Sticky Footer */}
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
              
              <button 
                className="m-modal-add-btn" 
                onClick={handleConfirm}
                style={{ 
                  background: isAdded ? 'var(--ck-green)' : 'var(--ck-brand-deep)',
                  transition: 'background 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {isAdded ? (
                  <>
                    <Check size={20} /> Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span className="m-add-text">Add to Order</span>
                    <span className="m-add-price">R {subtotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}