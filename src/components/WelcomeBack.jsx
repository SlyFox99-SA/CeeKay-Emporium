import { useEffect, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { getLastOrder, getProfile } from '../services/customerService';
import { useCart } from '../context/CartContext';
import { usePrefs } from '../context/PreferencesContext';
import { playPop } from '../lib/chime';
import { flyToCart } from '../lib/flyToCart';
import ItemImage from './ItemImage';

export default function WelcomeBack() {
  const [last, setLast] = useState(null);
  const [name, setName] = useState('');
  const { addToCart } = useCart();
  const { prefs } = usePrefs();

  useEffect(() => {
    (async () => {
      const order = await getLastOrder();
      if (order) setLast(order);
      const profile = getProfile();
      if (profile?.name) setName(profile.name.split(' ')[0]);
    })();
  }, []);

  if (!last) return null;

  const itemCount = last.items.reduce((s, i) => s + i.qty, 0);

  const handleReorder = (e) => {
    last.items.forEach((i) => {
      addToCart(
        { id: i.id, name: i.name, image: i.image, price: i.price },
        { qty: i.qty }
      );
    });
    if (prefs.sound) playPop();
    flyToCart(e.currentTarget, last.items[0]?.image);
  };

  return (
    <section className="welcome-back" data-reveal>
      <div className="welcome-back-inner">
        <div className="welcome-back-text">
          <div className="welcome-back-eyebrow">
            <Sparkles size={12} /> Welcome back{name ? `, ${name}` : ''}
          </div>
          <div className="welcome-back-title">Your usual?</div>
          <div className="welcome-back-sub">
            {itemCount} item{itemCount > 1 ? 's' : ''} · R {last.total.toFixed(2)} · last ordered{' '}
            {new Date(last.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
          </div>
        </div>

        <div className="welcome-back-thumbs">
          {last.items.slice(0, 3).map((it, i) => (
            <span key={i} className="welcome-back-thumb">
              <ItemImage src={it.image} alt={it.name} />
            </span>
          ))}
        </div>

        <button className="welcome-back-btn" onClick={handleReorder}>
          <RotateCcw size={14} /> Reorder
        </button>
      </div>
    </section>
  );
}
