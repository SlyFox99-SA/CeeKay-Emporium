
import { useEffect, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { getLastOrder } from '../services/customerService';
import { useCart } from '../context/CartContext';
import { usePrefs } from '../context/PreferencesContext';
import { playPop } from '../lib/chime';
import ItemImage from './ItemImage';

export default function MobileWelcomeBack() {
  const [last, setLast] = useState(null);
  const { addToCart } = useCart();
  const { prefs } = usePrefs();

  useEffect(() => {
    (async () => {
      const order = await getLastOrder();
      if (order) setLast(order);
    })();
  }, []);

  if (!last) return null;

  const itemCount = last.items.reduce((s, i) => s + i.qty, 0);

  const handleReorder = (e) => {
    last.items.forEach((i) => {
      addToCart({ id: i.id, name: i.name, image: i.image, price: i.price }, { qty: i.qty });
    });
    if (prefs.sound) playPop();
  };

  return (
    <div className="mobile-welcome-back">
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
    </div>
  );
}
