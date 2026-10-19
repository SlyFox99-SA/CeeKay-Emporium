import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Home, ReceiptText, User, Plus, Share2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useHaptics } from '../hooks/useHaptics';
import { getMenu, subscribeToMenu } from '../services/menuService';
import { useSilentPolling } from '../hooks/useSilentPolling';
import { flyToCart } from '../lib/flyToCart';
import { playPop } from '../lib/chime'; 
import { usePrefs } from '../context/PreferencesContext';

import ItemImage from '../components/ItemImage';
import MobileCartSidebar from '../components/mobile/MobileCartSidebar';
import MobileItemModal from '../components/mobile/MobileItemModal';
import StoreSelector from '../components/StoreSelector';
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

// HEAVY SPRING PHYSICS FOR CARDS
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.9, rotateX: 15 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 150, 
      damping: 20,
      mass: 1.2
    }
  }
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
  // Silent Sync: Realtime + Polling Fallback
  useEffect(() => {
    const unsubscribe = subscribeToMenu((newMenu) => {
      setMenu(newMenu);
    });
    return () => unsubscribe();
  }, []);

  // Poll every 45 seconds as a fallback (no loading spinners)
  useSilentPolling(async () => {
    try {
      const data = await getMenu();
      setMenu(data);
    } catch (err) {
      // Silent fail
    }
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
        await navigator.share({ title: 'CeeKay Emporium', text: 'Order the best kotas in Benoni!', url: window.location.origin });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.origin);
      setToast('Link copied!');
      setTimeout(() => setToast(''), 3000);
    }
  };

  return (
    <div className="mobile-app-shell" style={{ overflow: 'hidden' }}>
      <NetworkStatus />
      
      <header className="mobile-topbar">
        <div className="mobile-brand"><CKMark size={26} /><span>CeeKay</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StoreSelector />
          <button onClick={handleShare} style={{ background: 'transparent', border: 'none', color: 'var(--ck-brand-deep)', padding: 8 }}><Share2 size={20} /></button>
        </div>
      </header>

      <div className="m-main-content" style={{ position: 'relative' }}>
        <PullToRefresh onRefresh={reloadData}>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {activeTab === 'menu' && (
              <motion.div 
                key="menu"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
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
                          
                          <motion.div 
                            className="premium-food-grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                          >
                            {items.map((item, i) => {
                              const isSoldOut = item.available === false;
                              const imageUrl = (item.image && item.image.length > 5) ? item.image : "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop";
                              return (
                                <motion.div 
                                  key={item.id} 
                                  variants={cardVariants}
                                  whileHover={{ scale: 1.02, rotateY: 2 }}
                                  whileTap={!isSoldOut ? { scale: 0.95 } : {}}
                                  className={`premium-food-card ${isSoldOut ? 'sold-out' : ''}`} 
                                  onClick={() => { if (!isSoldOut) { haptics.medium(); setModalItem(item); } }}
                                  style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                                >
                                  <div className="premium-food-img" style={{ overflow: 'hidden', position: 'relative' }}>
                                    <motion.div 
                                      whileHover={{ scale: 1.1 }} 
                                      transition={{ type: 'spring', stiffness: 200, damping: 20 }} 
                                      style={{ width: '100%', height: '100%' }}
                                    >
                                      <ItemImage src={imageUrl} alt={item.name} />
                                    </motion.div>
                                    
                                    {/* HEAT SHIMMER OVERLAY */}
                                    <motion.div 
                                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                      style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,165,0,0.1) 100%)', pointerEvents: 'none' }}
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
                                      whileTap={{ scale: 0.6 }} 
                                      className="premium-add-btn" 
                                      onClick={(e) => {
                                        e.stopPropagation(); 
                                        addToCart(item, { qty: 1 }); 
                                        haptics.heavy(); 
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
      <PwaInstallBanner />

      <nav className="mobile-bottom-nav">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleTabChange('menu')} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', flex: 1, height: '100%', cursor: 'pointer', color: activeTab === 'menu' ? 'var(--ck-brand-deep)' : '#999' }}>
          {activeTab === 'menu' && <motion.div layoutId="nav-pill" style={{ position: 'absolute', top: '6px', width: '48px', height: '32px', background: 'var(--ck-cream)', borderRadius: '16px', zIndex: -1 }} />}
          <Home size={22} strokeWidth={activeTab === 'menu' ? 2.5 : 2} style={{ zIndex: 1 }} />
          <span style={{ fontSize: '10px', fontWeight: 700, zIndex: 1 }}>Menu</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleTabChange('orders')} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', flex: 1, height: '100%', cursor: 'pointer', color: activeTab === 'orders' ? 'var(--ck-brand-deep)' : '#999' }}>
          {activeTab === 'orders' && <motion.div layoutId="nav-pill" style={{ position: 'absolute', top: '6px', width: '48px', height: '32px', background: 'var(--ck-cream)', borderRadius: '16px', zIndex: -1 }} />}
          <ReceiptText size={22} strokeWidth={activeTab === 'orders' ? 2.5 : 2} style={{ zIndex: 1 }} />
          <span style={{ fontSize: '10px', fontWeight: 700, zIndex: 1 }}>Orders</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleTabChange('profile')} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', flex: 1, height: '100%', cursor: 'pointer', color: activeTab === 'profile' ? 'var(--ck-brand-deep)' : '#999' }}>
          {activeTab === 'profile' && <motion.div layoutId="nav-pill" style={{ position: 'absolute', top: '6px', width: '48px', height: '32px', background: 'var(--ck-cream)', borderRadius: '16px', zIndex: -1 }} />}
          <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} style={{ zIndex: 1 }} />
          <span style={{ fontSize: '10px', fontWeight: 700, zIndex: 1 }}>Profile</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setCartOpen(true); haptics.light(); }} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', flex: 1, height: '100%', cursor: 'pointer', color: '#999' }}>
          <div style={{ position: 'relative', display: 'flex' }}>
            <ShoppingBag size={22} strokeWidth={2} />
            {count > 0 && <motion.span key={count} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} style={{ position: 'absolute', top: '-6px', right: '-10px', background: 'var(--ck-action)', color: 'white', fontSize: '10px', fontWeight: 800, minWidth: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>{count}</motion.span>}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>Cart</span>
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