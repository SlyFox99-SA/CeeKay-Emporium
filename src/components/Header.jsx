 
import { ShoppingCart, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import CKMark from './CKMark';

export default function Header({ onCartClick }) {
  const { count } = useCart();
  const { store, clearStore } = useStore();

  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark">
          <CKMark size={38} variant="gradient" />
        </span>
        <div>
          <div className="brand-name">CeeKay Emporium</div>
          <div className="brand-sub">
            {store
              ? `${store.branch}${store.status === 'closed' ? ' � Closed' : ''}`
              : 'Kota, made properly'}
          </div>
        </div>
      </div>

      <div className="header-actions">
        {store && (
          <button className="store-pill" onClick={clearStore} title="Change store">
            <MapPin size={13} strokeWidth={2.4} />
            {store.branch}
            {store.status === 'closed' && <span className="store-closed-dot" />}
            <span className="store-pill-change">Change</span>
          </button>
        )}
        <button
          className="cart-btn"
          data-cart-target
          onClick={onCartClick}
          aria-label="Open cart"
        >
          <ShoppingCart size={17} strokeWidth={2.4} />
          <span className="cart-count">{count}</span>
        </button>
      </div>
    </header>
  );
}

