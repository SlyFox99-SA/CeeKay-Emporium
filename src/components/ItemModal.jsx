import { useEffect, useState } from 'react';
import { Minus, Plus, X, Check } from 'lucide-react';
import ItemImage from './ItemImage';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';

export default function ItemModal({ item, onClose, onConfirm }) {
  const isKota = Array.isArray(item?.ingredients);

  const swipeProps = useSwipeToDismiss(onClose);
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
    setRemoved(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const subtotal = item.price * qty;

  const handleConfirm = () => {
    onConfirm(item, { qty, removedIngredients: removed, itemNote: note });
    onClose();
  };

  return (
    <div className="item-modal-overlay" onClick={onClose}>
      <div className="item-modal" onClick={e => e.stopPropagation()}>`r`n        <div className="sheet-handle" />
        <button className="item-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="item-modal-hero">
          <div className="item-modal-photo">
            <ItemImage src={item.image} alt={item.name} />
          </div>
          <div className="item-modal-meta">
            <div className="item-modal-name">{item.name}</div>
            <div className="item-modal-price">R {item.price.toFixed(2)}</div>
            {item.desc && <div className="item-modal-desc">{item.desc}</div>}
          </div>
        </div>

        {isKota && item.ingredients.length > 0 && (
          <div className="item-modal-section">
            <div className="item-modal-label">What's on it</div>
            <div className="item-modal-ingredients">
              {item.ingredients.map((ing, i) => {
                const isRemoved = removed.includes(ing);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`ingredient-toggle ${isRemoved ? 'removed' : 'kept'}`}
                    onClick={() => toggleIngredient(ing)}
                  >
                    {isRemoved ? <X size={12} /> : <Check size={12} />}
                    <span>{ing}</span>
                  </button>
                );
              })}
            </div>
            {removed.length > 0 && (
              <div className="item-modal-hint">Tapped items are removed.</div>
            )}
          </div>
        )}

        <div className="item-modal-section">
          <div className="item-modal-label">Add a note (optional)</div>
          <textarea
            className="item-modal-note"
            placeholder="e.g. extra crispy, sauce on the side"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            maxLength={140}
          />
        </div>

        <div className="item-modal-foot">
          <div className="item-modal-qty">
            <button
              type="button"
              className="qty-btn-lg"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease"
            >
              <Minus size={14} />
            </button>
            <span className="qty-val-lg">{qty}</span>
            <button
              type="button"
              className="qty-btn-lg"
              onClick={() => setQty(q => Math.min(20, q + 1))}
              aria-label="Increase"
            >
              <Plus size={14} />
            </button>
          </div>
          <button className="item-modal-add" onClick={handleConfirm}>
            Add to Order — R {subtotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
