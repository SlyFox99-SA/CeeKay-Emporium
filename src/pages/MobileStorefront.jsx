import { useState, useEffect } from 'react';
import { MapPin, ShoppingBag, Home, ReceiptText, User, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { KOTAS, DRINKS } from '../data/menu';
import ItemImage from '../components/ItemImage';
import CartSidebar from '../components/CartSidebar';
import ItemModal from '../components/ItemModal';
import StoreSelector from '../components/StoreSelector';
import MobileOrders from '../components/MobileOrders';
import MobileProfile from '../components/MobileProfile';
import MobileSkeleton from '../components/MobileSkeleton';
import MobileWelcomeBack from '../components/MobileWelcomeBack';
import CKMark from '../components/CKMark';

export default function MobileStorefront() {
  const [activeTab, setActiveTab] = useState('menu');
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { addToCart, count } = useCart();
  const { store, clearStore } = useStore();

  useEffect(() => {
    // Simulate a fetch delay to show the skeleton (remove this in production)
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Handle Android Back Button
  useEffect(() => {
    const handlePopState = () => {
      if (cartOpen) { setCartOpen(false); window.history.pushState(null, '', window.location.href); }
      else if (modalItem) { setModalItem(null); window.history.pushState(null, '', window.location.href); }
      else if (activeTab !== 'menu') { setActiveTab('menu'); window.history.pushState(null, '', window.location.href); }
    };
    
    if (cartOpen || modalItem || activeTab !== 'menu') {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [cartOpen, modalItem, activeTab]);

  const handleModalConfirm = (item, options) => {
    addToCart(item, options);
    setModalItem(null);
  };

  const renderFoodItem = (item) => {
    const isSoldOut = item.available === false;
    return (
      <div 
        key={item.id} 
        className={`mobile-food-card ${isSoldOut ? 'sold-out' : ''}`} 
        onClick={() => !isSoldOut && setModalItem(item)}
      >
        <div className="mobile-food-img">
          <ItemImage src={item.image} alt={item.name} />
          {isSoldOut && <div className="sold-out-overlay">Sold Out</div>}
        </div>
        <div className="mobile-food-info">
          <div className="mobile-food-name">{item.name}</div>
          <div className="mobile-food-desc">{item.desc}</div>
          <div className="mobile-food-price">R {item.price}</div>
        </div>
        {!isSoldOut && (
          <button className="mobile-add-btn" onClick={(e) => {
            e.stopPropagation();
            addToCart(item, { qty: 1 });
          }}><Plus size={18} strokeWidth={3} /></button>
        )}
      </div>
    );
  };

  return (
    <div className="mobile-app-shell">
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <CKMark size={26} />
          <span>CeeKay</span>
        </div>
        {store && (
          <button className="mobile-store-pill" onClick={clearStore}>
            <MapPin size={12} /> {store.branch}
          </button>
        )}
      </header>

      <main className="mobile-scroll-area">
        {activeTab === 'menu' && (
          loading ? <MobileSkeleton /> : (
            <div className="mobile-menu-view">
              <MobileWelcomeBack />`r`n              <h1 className="mobile-greeting">What are you craving?</h1>
              
              <h2 className="mobile-section-title">Signature Kotas</h2>
              <div className="mobile-food-list">
                {KOTAS.map(renderFoodItem)}
              </div>

              <h2 className="mobile-section-title">Cold Drinks</h2>
              <div className="mobile-food-list">
                {DRINKS.map(renderFoodItem)}
              </div>
              <div style={{ height: 40 }} />
            </div>
          )
        )}

        {activeTab === 'orders' && <MobileOrders />}
        {activeTab === 'profile' && <MobileProfile />}
      </main>

      <nav className="mobile-bottom-nav">
        <button className={`mobile-nav-item ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          <Home size={22} strokeWidth={activeTab === 'menu' ? 2.5 : 2} />
          <span>Menu</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <ReceiptText size={22} strokeWidth={activeTab === 'orders' ? 2.5 : 2} />
          <span>Orders</span>
        </button>
        <button className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          <span>Profile</span>
        </button>
        <button className="mobile-nav-item cart-tab" onClick={() => setCartOpen(true)}>
          <div className="mobile-cart-icon-wrap">
            <ShoppingBag size={22} strokeWidth={2} />
            {count > 0 && <span className="mobile-cart-badge">{count}</span>}
          </div>
          <span>Cart</span>
        </button>
      </nav>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      <ItemModal item={modalItem} onClose={() => setModalItem(null)} onConfirm={handleModalConfirm} />
      <StoreSelector />
    </div>
  );
}