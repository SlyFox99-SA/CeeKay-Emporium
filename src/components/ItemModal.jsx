/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X, Check } from 'lucide-react';
import ItemImage from './ItemImage';
import { useHaptics } from '../hooks/useHaptics';

export default function ItemModal({ item, onClose, onConfirm }) {
  const haptics = useHaptics();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [selectedMods, setSelectedMods] = useState([]);

  useEffect(() => {
    if (!item) return;
    setQty(1); setNote(''); setSelectedMods([]);
  }, [item?.id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (item) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, onClose]);

  if (!item) return null;

  const extras = item.available_modifiers?.filter(m => m.category === 'extra') || [];
  const prefs = item.available_modifiers?.filter(m => m.category === 'preference') || [];

  const toggleMod = (mod) => {
    haptics.light();
    setSelectedMods(prev => {
      const exists = prev.find(m => m.id === mod.id);
      if (exists) return prev.filter(m => m.id !== mod.id);
      return [...prev, { ...mod, qty: 1 }];
    });
  };

  const basePrice = Number(item.price) || 0;
  const modsTotal = selectedMods.reduce((sum, mod) => sum + (Number(mod.sell_price || 0) * (mod.qty || 1)), 0);
  const subtotal = (basePrice + modsTotal) * (qty || 1);

  const handleConfirm = () => {
    haptics.success();
    onConfirm(item, { qty, modifiers: selectedMods, itemNote: note });
    onClose();
  };

  return (
    <div className="ck-dk-modal-overlay" onClick={onClose}>
      <motion.div 
        className="ck-dk-modal-container" 
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* LEFT SIDE: IMAGE */}
        <div className="ck-dk-modal-left">
          <ItemImage src={item.image} alt={item.name} />
          <button className="ck-dk-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* RIGHT SIDE: DETAILS */}
        <div className="ck-dk-modal-right">
          <div className="ck-dk-modal-header">
            <h2 className="ck-dk-modal-title">{item.name}</h2>
            <div className="ck-dk-modal-price">R {basePrice.toFixed(2)}</div>
          </div>
          
          {item.desc && <p className="ck-dk-modal-desc">{item.desc}</p>}

          <div className="ck-dk-modal-scroll">
            {extras.length > 0 && (
              <div className="ck-dk-modal-section">
                <h3 className="ck-dk-modal-section-title">Make it a Beast</h3>
                <div className="ck-dk-modal-options">
                  {extras.map(mod => {
                    const isSelected = selectedMods.some(m => m.id === mod.id);
                    return (
                      <button 
                        key={mod.id} 
                        onClick={() => toggleMod(mod)} 
                        className={`ck-dk-modal-option ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="ck-dk-option-info">
                          <span className="ck-dk-option-name">{mod.name}</span>
                          <span className="ck-dk-option-price">+ R{mod.sell_price}</span>
                        </div>
                        <div className={`ck-dk-option-check ${isSelected ? 'active' : ''}`}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {prefs.length > 0 && (
              <div className="ck-dk-modal-section">
                <h3 className="ck-dk-modal-section-title">Customize</h3>
                <div className="ck-dk-modal-options">
                  {prefs.map(pref => {
                    const isSelected = selectedMods.some(m => m.id === pref.id);
                    return (
                      <button 
                        key={pref.id} 
                        onClick={() => toggleMod(pref)} 
                        className={`ck-dk-modal-option ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="ck-dk-option-info">
                          <span className="ck-dk-option-name">{pref.name}</span>
                        </div>
                        <div className={`ck-dk-option-check ${isSelected ? 'active' : ''}`}>
                          {isSelected && <Check size={14} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="ck-dk-modal-section">
              <h3 className="ck-dk-modal-section-title">Add a note (optional)</h3>
              <textarea
                className="ck-dk-modal-note"
                placeholder="e.g. extra crispy, sauce on the side"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="ck-dk-modal-footer">
            <div className="ck-dk-modal-qty">
              <button onClick={() => { haptics.light(); setQty(q => Math.max(1, q - 1)); }}><Minus size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => { haptics.light(); setQty(q => q + 1); }}><Plus size={16} /></button>
            </div>
            <button className="ck-dk-modal-add-btn" onClick={handleConfirm}>
              Add • R {subtotal.toFixed(2)}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
