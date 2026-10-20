import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Home, ReceiptText, User, Plus, Share2, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useHaptics } from '../hooks/useHaptics';
import { getMenu, subscribeToMenu } from '../services/menuService';
import { useSilentPolling } from '../hooks/useSilentPolling';
import { flyToCart } from '../lib/flyToCart';
import { playPop } from '../lib/chime'; 
import { usePrefs } from '../context/PreferencesContext';
import { openGoogleMaps } from '../lib/mapsUtils';

import ItemImage from '../components/ItemImage';
import MobileCartSidebar from '../components/mobile/MobileCartSidebar';
import MobileItemModal from '../components/mobile/MobileItemModal';
import MobileOrders from '../components/MobileOrders';
import MobileProfile from '../components/MobileProfile';
import MobileSkeleton from '../components/MobileSkeleton';
import MobileWelcomeBack from '../components/MobileWelcomeBack';
import CKMark from '../components/CKMark';
import NetworkStatus from '../components/NetworkStatus';
import ActiveOrderBar from '../components/mobile/ActiveOrderBar';
import ErrorState from '../components/mobile/ErrorState';
import PullToRefresh from '../components/mobile/PullToRefresh';
import Toast from '../components/mobile/Toast';
import GuestModeBanner from '../components/mobile/GuestModeBanner';

const CATEGORY_TITLES = {
  kotas: 'Signature Kotas',
  drinks: 'Cold Drinks',
  sides: 'Sides & Extras',
  desserts: 'Desserts'
};

const TABS = ['menu', 'orders', 'profile'];

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 })
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 }}
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.9, rotateX: 15 },
  show: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: { type: "spring",stiffness: 150, damping: 20, mass: 1.2 } }
};

export default function MobileStorefront() {
  const [activeTab, setActiveTab] = useState('menu');
  const [[pageIndex, direction], setPageIndex] = useState([0, 0]);
  
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState(null);
  
  const [menu, setMenu] = useState({});

  const { addToCart, count } = useCart();
  const { store } = useStore();
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
      window.dispatchEvent(new Event('app_ready'));
    }
  };

  useEffect(() => { reloadData(); }, []);
  
  useEffect(() => {
    const unsubscribe = subscribeToMenu((newMenu) => setMenu(newMenu));
    return () => unsubscribe();
  }, []);

  useSilentPolling(async () => {
    try {
      const data = await getMenu();
      setMenu(data);
    } catch (err) {}
  }, 45000);

  const handleModalConfirm = (item, options) => {
    addToCart(item, options);
    setModalItem(null);
  };

  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    const newIndex = TABS.indexOf(tab);
    const currentIndex = TABS.indexOf(activeTab);
    const dir = newIndex > currentIndex ? 1 : -1;
    setPageIndex([newIndex, dir]);
    haptics.light();
    setActiveTab(tab);
  };

  const handleShare = async () => {
    haptics.light();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CeeKay Emporium', text: 'Order the bestkotas in Benoni!', url: window.location.origin });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.origin);
      setToast('Link copied!');
      setTimeout(() => setToast(''), 3000);
    }
  };

  return (
    <div className="mobile-app-shell" style={{ overflow: 'hidden', position: 'relative' }}>
      
      {/* MOBILE 3D BACKGROUND - Pure CSS Gradient */}
      <motion.div 
        animate={{ y: [0, -15, 0], scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="ck-m-3d-bg"
        style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}
      />

      <NetworkStatus />
      
      <header className="mobile-topbar" style={{ position: 'relative', zIndex: 10 }}>
        <div className="mobile-brand">
          <CKMark size={26} />
          <span>CeeKay</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          
          <button 
            onClick={() => { haptics.light(); openGoogleMaps(store); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--ck-cream)', padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, color: 'var(--ck-brand-deep)', border: 'none', cursor: 'pointer' }}
          >
            <MapPin size={12} /> {store?.branch || 'Locate Us'}
          </button>
          
          <button onClick={handleShare} style={{ background: 'transparent', border: 'none', color: 'var(--ck-brand-deep)', padding: 8 }}><Share2 size={20} /></button>
        </div>
      </header>

      <GuestModeBanner />

      <div className="m-main-content" style={{ position: 'relative', zIndex: 10}}>
        <PullToRefresh onRefresh={reloadData}>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {activeTab === 'menu' && (
              <motion.div 
                key="menu" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              >
                {loading ? <MobileSkeleton /> : error ? <ErrorState onRetry={reloadData} /> : (
                  <div className="mobile-menu-view">
                    <MobileWelcomeBack />
                    
                    {Object.entries(menu).map(([categoryKey, items]) => {
                      if (!items || items.length === 0) return null;
                      const title = CATEGORY_TITLES[categoryKey] || (categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1));
                      return (
                        <div key={categoryKey} style={{ marginBottom: '40px' }}>
                          <div className="mobile-category-header">
                            <h2 className="mobile-section-title">{title}</h2>
                          </div>
                          
                          <motion.div className="premium-food-grid" variants={containerVariants} initial="hidden" animate="show">
                            {items.map((item) => {
                              const isSoldOut = item.available === false;
                              const imageUrl = item.image;
                              return (
                                <motion.div 
                                  key={item.id} variants={cardVariants} whileHover={{ scale: 1.02, rotateY: 2 }} whileTap={!isSoldOut ? { scale: 0.95 } : {}}
                                  className={`premium-food-card ${isSoldOut ? 'sold-out' : ''}`} 
                                  onClick={() => { if (!isSoldOut) { haptics.medium(); setModalItem(item); } }}
                                  style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                                >
                                  <div className="premium-food-img">
                                    <ItemImage src={imageUrl} alt={item.name}/>
                                    
                                    <motion.div 
                                      animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                      style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,165,0,0.1)100%)', pointerEvents: 'none' }}
                                    />

                                    {isSoldOut && <div className="sold-out-overlay">Sold Out</div>}
                                    {item.popular && <div className="premium-food-badge">Popular</div>}
                                  </div>
                                  
                                  <div className="premium-food-body">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <h3 className="premium-food-name">{item.name}</h3>
                                      <span className="premium-food-price">R {item.price}</span>
                                    </div>
                                    <p className="premium-food-desc">{item.desc}</p>
                                  </div>

                                  {!isSoldOut && (
                                    <motion.button 
                                      whileTap={{ scale: 0.6 }} className="premium-add-btn" 
                                      onClick={(e) => {
                                        e.stopPropagation(); addToCart(item, { qty: 1 }); haptics.heavy(); 
                                        if (prefs.sound) playPop(); 
                                        flyToCart(e, item.image);
                                      }}
                                    >
                                      <Plus size={20} strokeWidth={3} />
                                    </motion.button>
                                  )}
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}>
                <MobileOrders />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}>
                <MobileProfile />
              </motion.div>
            )}
          </AnimatePresence>
        </PullToRefresh>
      </div>

      <ActiveOrderBar />

      <nav className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 'calc(72px + env(safe-area-inset-bottom))', background: 'rgba(255, 255, 255, 0.90)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 100, boxShadow: '0 -10px 40px rgba(0,0,0,0.05)' }}>
        {[
          { id: 'menu', label: 'Menu', icon: Home },
          { id: 'orders', label: 'Orders', icon: ReceiptText },
          { id: 'profile', label: 'Profile', icon: User }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <motion.button 
              key={tab.id}
              whileTap={{ scale: 0.9 }} 
              onClick={() => handleTabChange(tab.id)} 
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', flex: 1, height: '100%', cursor: 'pointer', color: isActive ? 'var(--ck-brand-deep)' : '#999', transition: 'color 0.2s ease', paddingTop: '12px' }}
            >
              {isActive && (
                <motion.div 
                  layoutId="nav-pill" 
                  style={{ position: 'absolute', top: '12px', width: '52px', height: '32px', background: 'var(--ck-cream)', borderRadius: '16px', zIndex: -1 }} 
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} style={{zIndex: 1 }} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 800 : 600, zIndex: 1, marginTop: '4px' }}>{tab.label}</span>
            </motion.button>
          );
        })}

        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => { setCartOpen(true); haptics.light(); }} 
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', flex: 1, height: '100%', cursor: 'pointer', color: '#999', paddingTop: '12px' }}
        >
          <div style={{ position: 'relative', display: 'flex' }}>
            <ShoppingBag size={22} strokeWidth={2} />
            {count > 0 && (
              <motion.span 
                key={count} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} 
                style={{ position: 'absolute', top: '-6px', right: '-10px', background: 'var(--ck-action)', color: 'white', fontSize: '10px', fontWeight: 800, minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}
              >
                {count}
              </motion.span>
            )}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px' }}>Cart</span>
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