 
import { useEffect, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLastOrder } from '../services/customerService';
import { useCart } from '../context/CartContext';
import { usePrefs } from '../context/PreferencesContext';
import { playPop } from '../lib/chime';
import ItemImage from './ItemImage';

export default function MobileWelcomeBack() {
  const [last, setLast] = useState(undefined); // undefined = loading
  const { addToCart } = useCart();
  const { prefs } = usePrefs();

  useEffect(() => {
    (async () => {
      try {
        const order = await getLastOrder();
        setLast(order || null);
      } catch {
        setLast(null);
      }
    })();
  }, []);

  // 1. SKELETON STATE: Perfectly matches the height of the real banner
  if (last === undefined) {
    return (
      <div style={{ height: '104px', borderRadius: '20px', background: 'rgba(0,0,0,0.04)', marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
    );
  }

  // 2. EMPTY STATE: Safe to return null because we only render this if there IS history
  if (last === null) return null;

  const itemCount = last.items.reduce((s, i) => s + i.qty, 0);

  const handleReorder = (e) => {
    last.items.forEach((i) => {
      addToCart({ id: i.id, name: i.name, image: i.image, price: i.price }, { qty: i.qty });
    });
    if (prefs.sound) playPop();
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="mobile-welcome-back"
    >
      <div className="mwb-content">
        <div className="mwb-eyebrow">
          <Sparkles size={12} /> Welcome back
        </div>
        <div className="mwb-title">Your usual?</div>
        
        <div className="mwb-thumbs-row">
          <div className="mwb-thumbs">
            {last.items.slice(0, 3).map((it, i) => (
              <div key={i} className="mwb-thumb">
                <ItemImage src={it.image} alt={it.name} />
              </div>
            ))}
          </div>
          <div className="mwb-count">{itemCount} items</div>
        </div>
      </div>
      
      <button className="mwb-btn" onClick={handleReorder}>
        <RotateCcw size={14} /> Reorder
      </button>
    </motion.div>
  );
}
