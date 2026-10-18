import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Home, ReceiptText, User, Plus, Share2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useHaptics } from '../hooks/useHaptics';
import { getMenu } from '../services/menuService';
import { flyToCart } from '../lib/flyToCart';
import { playPop } from '../lib/chime'; 
import { usePrefs } from '../context/PreferencesContext';

import ItemImage from '../components/ItemImage';
import MobileCartSidebar from '../components/mobile/MobileCartSidebar';
import MobileItemModal from '../components/mobile/MobileItemModal';
import StoreSelector from '../components/StoreSelector'; // Correct path
import MobileOrders from '../components/MobileOrders';
import MobileProfile from '../components/MobileProfile';
import MobileSkeleton from '../components/MobileSkeleton';
import MobileWelcomeBack from '../components/MobileWelcomeBack';
import CKMark from '../components/CKMark';
import PwaInstallBanner from '../components/mobile/PwaInstallBanner';
import NetworkStatus from '../components/NetworkStatus';
import ActiveOrderBar from '../components/mobile/ActiveOrderBar';
import ErrorState from '../components/mobile/ErrorState';
import PullToRefresh from '../components/mobile/PullToRefresh';
import Toast from '../components/mobile/Toast';

export default function MobileStorefront() {
  const [activeTab, setActiveTab] = useState('menu');
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState(null);
  
  const [menu, setMenu] = useState({ kotas: [], drinks: [] });

  const { addToCart, count } = useCart();
  const { prefs } = usePrefs();
  const haptics = useHaptics();

  useEffect(() => {
    if (cartOpen || modalItem) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [cartOpen, modalItem]);

  const reloadData = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getMenu();
      setMenu(data);
    } catch (err) {
      console.error("Failed to load menu:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reloadData(); }, []);

  const handleModalConfirm = (item, options) => {
    addToCart(item, options);
    setModalItem(null);
  };

  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    haptics.light();
    setActiveTab(tab);
  };

  const handleShare = async () => {
    haptics.light();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CeeKay Emporium', text: 'Order the best kotas in Benoni!', url: window.location.origin });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.origin);
      setToast('Link copied!');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const renderFoodItem = (item, index) => {
    const isSoldOut = item.available === false;
    const imageUrl = (item.image && item.image.length > 5) ? item.image : "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop";

    return (
      <motion.div 
        key={item.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.05 }}
        whileTap={!isSoldOut ? { scale: 0.97 } : {}}
        className={`premium-food-card ${isSoldOut ? 'sold-out' : ''}`} 
        onClick={() => { if (!isSoldOut) { haptics.medium(); setModalItem(item); } }}
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
          <motion.button whileTap={{ scale: 0.8 }} className="premium-add-btn" onClick={(e) => {
            e.stopPropagation(); addToCart(item, { qty: 1 }); haptics.light(); if (prefs.sound) playPop(); flyToCart(e, item.image);
          }}>
            <Plus size={20} strokeWidth={3} />
          </motion.button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="mobile-app-shell">
      <NetworkStatus />
      
      <header className="mobile-topbar">
        <div className="mobile-brand"><CKMark size={26} /><span>CeeKay</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StoreSelector />
          <button onClick={handleShare} style={{ background: 'transparent', border: 'none', color: 'var(--ck-brand-deep)', padding: 8 }}><Share2 size={20} /></button>
        </div>
      </header>

      <div className="m-main-content">
        <PullToRefresh onRefresh={reloadData}>
          <AnimatePresence mode="wait">
            {activeTab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                {loading ? <MobileSkeleton /> : error ? <ErrorState onRetry={reloadData} /> : (
                  <div className="mobile-menu-view">
                    <MobileWelcomeBack />
                    <div className="mobile-category-header"><h2 className="mobile-section-title">Signature Kotas</h2></div>
                    <div className="premium-food-grid">{menu.kotas.map((item, i) => renderFoodItem(item, i))}</div>
                    <div className="mobile-category-header"><h2 className="mobile-section-title">Cold Drinks</h2></div>
                    <div className="premium-food-grid">{menu.drinks.map((item, i) => renderFoodItem(item, i + menu.kotas.length))}</div>
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === 'orders' && <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}><MobileOrders /></motion.div>}
            {activeTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}><MobileProfile /></motion.div>}
          </AnimatePresence>
        </PullToRefresh>
      </div>

      <ActiveOrderBar />
      <PwaInstallBanner />

      <nav className="mobile-bottom-nav">
        <motion.button whileTap={{ scale: 0.9 }} className={`mobile-nav-item ${activeTab === 'menu' ? 'active' :''}`} onClick={() => handleTabChange('menu')}><Home size={22} strokeWidth={activeTab === 'menu' ? 2.5 : 2} /><span>Menu</span></motion.button>
        <motion.button whileTap={{ scale: 0.9 }} className={`mobile-nav-item ${activeTab === 'orders' ? 'active': ''}`} onClick={() => handleTabChange('orders')}><ReceiptText size={22} strokeWidth={activeTab === 'orders' ? 2.5 : 2}/><span>Orders</span></motion.button>
        <motion.button whileTap={{ scale: 0.9 }} className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}><User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} /><span>Profile</span></motion.button>
        <motion.button whileTap={{ scale: 0.9 }} className="mobile-nav-item cart-tab" onClick={() => { setCartOpen(true); haptics.light(); }}>
          <div className="mobile-cart-icon-wrap">
            <ShoppingBag size={22} strokeWidth={2} />
            {count > 0 && <motion.span key={count} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="mobile-cart-badge">{count}</motion.span>}
          </div>
          <span>Cart</span>
        </motion.button>
      </nav>

      <AnimatePresence>
        {cartOpen && <MobileCartSidebar open={cartOpen} onClose={() => setCartOpen(false)} onToast={setToast} />}
        {modalItem && <MobileItemModal item={modalItem} onClose={() => setModalItem(null)} onConfirm={handleModalConfirm} />}
      </AnimatePresence>
      
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}