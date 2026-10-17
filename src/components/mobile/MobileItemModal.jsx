
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X, Check } from 'lucide-react';
import ItemImage from '../ItemImage';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';
import { useHaptics } from '../../hooks/useHaptics';
import { DRINKS } from '../../data/menu';

export default function MobileItemModal({ item, onClose, onConfirm }) {
  const isKota = Array.isArray(item?.ingredients);
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();

  const [qty, setQty] = useState(1);
  const [removed, setRemoved] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!item) return;
    setQty(1); setRemoved([]); setNote('');
  }, [item?.id]);

  if (!item) return null;

  const toggleIngredient = (name) => {
    haptics.light();
    setRemoved(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const subtotal = item.price * qty;

  const handleConfirm = () => {
    haptics.success();
    onConfirm(item, { qty, removedIngredients: removed, itemNote: note });
    onClose();
  };

  const handleAddUpsell = (drink) => {
    haptics.light();
    onConfirm(drink, { qty: 1 }); 
  };

  return (
    <div className="m-modal-overlay" onClick={onClose}>
      <motion.div 
        className="m-modal-sheet" 
        onClick={e => e.stopPropagation()}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header area with drag handle */}
        <div className="m-modal-header" {...swipeProps} style={{ touchAction: 'none' }}>
          <div className="m-sheet-handle" />
          <button className="m-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Scrollable Body */}
        <div className="m-modal-body">
          <div className="m-modal-photo">
            <ItemImage src={item.image} alt={item.name} />
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
                      <button key={i} className={`m-ingredient-toggle ${isRemoved ? 'removed' : 'kept'}`} onClick={() => toggleIngredient(ing)}>
                        {isRemoved ? <X size={14} /> : <Check size={14} />} <span>{ing}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {isKota && (
            <div className="m-upsell-section">
              <div className="m-upsell-title">Perfect with a cold drink</div>
              <div className="m-upsell-scroll">
                {DRINKS.map(drink => (
                  <div key={drink.id} className="m-upsell-card" onClick={() => handleAddUpsell(drink)}>
                    <div className="m-upsell-img">
                      <ItemImage src={drink.image} alt={drink.name} />
                    </div>
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

          <div className="m-modal-note-container">
            <div className="m-modal-section-title">Add a note (optional)</div>
            <textarea className="m-modal-note" placeholder="e.g. extra crispy..." value={note} onChange={e => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="m-modal-foot">
          <div className="m-modal-qty">
            <button className="m-qty-btn" onClick={() => { haptics.light(); setQty(q => Math.max(1, q - 1)); }} disabled={qty <= 1}><Minus size={16} /></button>
            <span className="m-qty-val">{qty}</span>
            <button className="m-qty-btn" onClick={() => { haptics.light(); setQty(q => Math.min(20, q + 1)); }}><Plus size={16} /></button>
          </div>
          <button className="m-modal-add-btn" onClick={handleConfirm}>
            <span className="m-add-text">Add to Order</span>
            <span className="m-add-price">R {subtotal.toFixed(2)}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
