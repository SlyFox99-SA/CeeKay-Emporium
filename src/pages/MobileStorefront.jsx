import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ShoppingBag, Home, ReceiptText, User, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useHaptics } from '../hooks/useHaptics';
import { getMenu } from '../services/menuService';
import ItemImage from '../components/ItemImage';
import MobileCartSidebar from '../components/mobile/MobileCartSidebar';
import MobileItemModal from '../components/mobile/MobileItemModal';
import StoreSelector from '../components/StoreSelector';
import MobileOrders from '../components/MobileOrders';
import MobileProfile from '../components/MobileProfile';
import MobileSkeleton from '../components/MobileSkeleton';
import MobileWelcomeBack from '../components/MobileWelcomeBack';
import CKMark from '../components/CKMark';

// We are hardcoding these to guarantee the visual layout works perfectly
const PERFECT_IMAGES = {
  'mezozo': "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop",
  'emporium-bliss': "https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=600&auto=format&fit=crop",
  'emporium-chaw': "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop",
  'orange-soda': "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=600&auto=format&fit=crop", 
  'coca-cola': "https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=600&auto=format&fit=crop" 
};

export default function MobileStorefront() {
  const [activeTab, setActiveTab] = useState('menu');
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [menu, setMenu] = useState({ kotas: [], drinks: [] });

  const { addToCart, count } = useCart();
  const { store, clearStore } = useStore();
  const haptics = useHaptics();

  useEffect(() => {
    async function loadMenu() {
      const data = await getMenu();
      setMenu(data);
      setLoading(false);
    }
    loadMenu();
  }, []);

  const handleModalConfirm = (item, options) => {
    addToCart(item, options);
    setModalItem(null);
  };

  const renderFoodItem = (item) => {
    const isSoldOut = item.available === false;
    
    // Use the hardcoded map, fallback to a burger if slug is missing
    const imageUrl = PERFECT_IMAGES[item.slug] || PERFECT_IMAGES['mezozo'];

    return (
      <motion.div 
        key={item.id} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={`premium-food-card ${isSoldOut ? 'sold-out' : ''}`} 
        onClick={() => {
          if (!isSoldOut) {
            haptics.medium();
            setModalItem(item);
          }
        }}
      >
        <div className="premium-food-img">
          <img src={imageUrl} alt={item.name} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop"; }} />
          {isSoldOut && <div className="sold-out-overlay">Sold Out</div>}
          {item.popular && <div className="premium-food-badge">Popular</div>}
        </div>
        
        <div className="premium-food-body">
          <div className="premium-food-header">
            <h3 className="premium-food-name">{item.name}</h3>
            <span className="premium-food-price">R {item.price}</span>
          </div>
          <p className="premium-food-desc">{item.desc}</p>
        </div>

        {!isSoldOut && (
          <button className="premium-add-btn" onClick={(e) => {
            e.stopPropagation();
            addToCart(item, { qty: 1 });
            haptics.light();
          }}>
            <Plus size={20} strokeWidth={3} />
          </button>
        )}
      </motion.div>
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
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? <MobileSkeleton /> : (
                <div className="mobile-menu-view">
                  <MobileWelcomeBack />
                  
                  <div className="mobile-category-header">
                    <h2 className="mobile-section-title">Signature Kotas</h2>
                  </div>
                  <div className="premium-food-grid">
                    {menu.kotas.map(renderFoodItem)}
                  </div>

                  <div className="mobile-category-header">
                    <h2 className="mobile-section-title">Cold Drinks</h2>
                  </div>
                  <div className="premium-food-grid">
                    {menu.drinks.map(renderFoodItem)}
                  </div>
                  {/* Safe area spacer so the bottom nav doesn't cover the last row */}
                  <div style={{ height: 100 }} />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <MobileOrders />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <MobileProfile />
            </motion.div>
          )}
        </AnimatePresence>
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
        <button className="mobile-nav-item cart-tab" onClick={() => { setCartOpen(true); haptics.light(); }}>
          <div className="mobile-cart-icon-wrap">
            <ShoppingBag size={22} strokeWidth={2} />
            {count > 0 && (
              <motion.span 
                key={count}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="mobile-cart-badge"
              >
                {count}
              </motion.span>
            )}
          </div>
          <span>Cart</span>
        </button>
      </nav>

      <AnimatePresence>
        {cartOpen && <MobileCartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />}
        {modalItem && <MobileItemModal item={modalItem} onClose={() => setModalItem(null)} onConfirm={handleModalConfirm} />}
      </AnimatePresence>
      
      <StoreSelector />
    </div>
  );
}