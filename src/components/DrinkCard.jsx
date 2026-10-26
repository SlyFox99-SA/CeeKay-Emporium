 
import { useCart } from '../context/CartContext';
import { usePrefs } from '../context/PreferencesContext';
import { flyToCart } from '../lib/flyToCart';
import { playPop } from '../lib/chime';
import ItemImage from './ItemImage';

export default function DrinkCard({ item, onAdd, onOpenModal }) {
  const { addToCart } = useCart();
  const { prefs } = usePrefs();

  const flashCard = (el) => {
    const card = el.closest('.drink-card');
    if (!card) return;
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 600);
  };

  const quickAdd = (e) => {
    e.stopPropagation();
    addToCart(item, { qty: 1 });
    onAdd(item);
    if (prefs.sound) playPop();
    flyToCart(e.currentTarget, item.image);
    flashCard(e.currentTarget);
  };

  const openModal = () => onOpenModal(item);

  return (
    <div className="drink-card">
      <button className="drink-photo" onClick={openModal} aria-label={`Customize ${item.name}`}>
        <ItemImage src={item.image} alt={item.name} />`r`n        {item.popular && <span className="popular-pill">? Popular</span>}
      </button>
      <div className="drink-name">{item.name}</div>
      <div className="drink-desc">{item.desc}</div>
      <button className="drink-add" onClick={quickAdd}>+ Add � R{item.price}</button>
    </div>
  );
}

