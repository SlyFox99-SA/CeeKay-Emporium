import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X, Check } from 'lucide-react';
import ItemImage from './ItemImage';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';
import { useHaptics } from '../hooks/useHaptics';

export default function ItemModal({ item, onClose, onConfirm }) {
  const isKota = Array.isArray(item?.ingredients);
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();

  const [qty, setQty] = useState(1);
  const [removed, setRemoved] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!item) return;
    setQty(1);
    setRemoved([]);
    setNote('');
  }, [item?.id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (item) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, onClose]);

  if (!item) return null;

  const toggleIngredient = (name) => {
    haptics.light();
    setRemoved(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const subtotal = item.price * qty;

  const handleConfirm = () => {
    haptics.success();
    onConfirm(item, { qty, removedIngredients: removed, itemNote: note });
    onClose();
  };

  return (
    <div className="mobile-modal-overlay" onClick={onClose}>
      <motion.div 
        className="mobile-modal-sheet" 
        onClick={e => e.stopPropagation()}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        
        <div className="mobile-modal-header" {...swipeProps} style={{ touchAction: 'none' }}>
          <div className="mobile-sheet-handle" />
          <button className="mobile-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mobile-modal-body">
          <div className="mobile-modal-hero">
            <div className="mobile-modal-photo">
              <ItemImage src={item.image} alt={item.name} />
            </div>
            <div className="mobile-modal-meta">
              <div className="mobile-modal-name">{item.name}</div>
              <div className="mobile-modal-price">R {item.price.toFixed(2)}</div>
              {item.desc && <div className="mobile-modal-desc">{item.desc}</div>}
            </div>
          </div>

          {isKota && item.ingredients.length > 0 && (
            <div className="mobile-modal-section">
              <div className="mobile-modal-label">What's on it</div>
              <div className="mobile-modal-ingredients">
                {item.ingredients.map((ing, i) => {
                  const isRemoved = removed.includes(ing);
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`mobile-ingredient-toggle ${isRemoved ? 'removed' : 'kept'}`}
                      onClick={() => toggleIngredient(ing)}
                    >
                      {isRemoved ? <X size={14} /> : <Check size={14} />}
                      <span>{ing}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mobile-modal-section">
            <div className="mobile-modal-label">Add a note (optional)</div>
            <div className="mobile-textarea-wrapper">
              <textarea
                className="mobile-modal-note"
                placeholder="e.g. extra crispy, sauce on the side"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="mobile-modal-foot">
          <div className="mobile-modal-qty">
            <button className="mobile-qty-btn" onClick={() => { haptics.light(); setQty(q => Math.max(1, q - 1)); }} disabled={qty <= 1}>
              <Minus size={16} />
            </button>
            <span className="mobile-qty-val">{qty}</span>
            <button className="mobile-qty-btn" onClick={() => { haptics.light(); setQty(q => Math.min(20, q + 1)); }}>
              <Plus size={16} />
            </button>
          </div>
          <button className="mobile-modal-add-btn" onClick={handleConfirm}>
            <span className="mobile-add-text">Add to Order</span>
            <span className="mobile-add-price">R {subtotal.toFixed(2)}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}