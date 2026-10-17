import { useCart } from '../context/CartContext';
import { usePrefs } from '../context/PreferencesContext';
import { flyToCart } from '../lib/flyToCart';
import { playPop } from '../lib/chime';
import ItemImage from './ItemImage';

export default function KotaCard({ item, onAdd, onOpenModal }) {
  const { addToCart } = useCart();
  const { prefs } = usePrefs();

  const flashCard = (el) => {
    const card = el.closest('.dish-card');
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
    <div className="dish-card">
      {item.ribbon && <div className="ribbon">{item.ribbon}</div>}

      <button className="dish-photo" onClick={openModal} aria-label={`Customize ${item.name}`}>
        <ItemImage src={item.image} alt={item.name} />`r`n        {item.popular && <span className="popular-pill">★ Popular</span>}
        <span className={`dish-tag dish-tag-overlay ${item.tagClass}`}>{item.tag}</span>
        <span className="dish-customize-hint">Tap to customize</span>
      </button>

      <div className="dish-body">
        <div className="dish-name">{item.name}</div>
        <div className="dish-desc">{item.desc}</div>
        <div className="dish-ingredients">
          {item.ingredients.map((ing, i) => <span key={i} className="ingr">{ing}</span>)}
        </div>
        <div className="dish-footer">
          <div className="dish-price"><span className="cur">R</span>{item.price}</div>
          <button className="add-btn" onClick={quickAdd}>+ Add</button>
        </div>
      </div>
    </div>
  );
}
