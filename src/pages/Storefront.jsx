 
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, Leaf, Flame, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useHaptics } from '../hooks/useHaptics';
import { getMenu } from '../services/menuService';
import { openGoogleMaps } from '../lib/mapsUtils';
import ItemImage from '../components/ItemImage';
import CartSidebar from '../components/CartSidebar';
import ItemModal from '../components/ItemModal';
import CKMark from '../components/CKMark';
import GuestModeBanner from '../components/mobile/GuestModeBanner';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const cardVariants = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function Storefront() {
  const [menu, setMenu] = useState({ kotas: [], drinks: [] });
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  
  const menuRef = useRef(null);
  const { addToCart, count } = useCart();
  const { store } = useStore();
  const haptics = useHaptics();

  useEffect(() => {
    getMenu().then(data => { setMenu(data); setLoading(false); });
  }, []);

  const handleModalConfirm = (item, options) => { addToCart(item, options); setModalItem(null); };
  const scrollToMenu = () => { menuRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="ck-dk-shell">
      <GuestModeBanner />

      <div className="ck-dk-marquee">
        <div className="ck-dk-marquee-content">
          <span>HAAR DAILY</span><span>|</span><span>EST. 2021 - BENONI, GAUTENG</span><span>|</span><span>KOTAS FROM R20</span><span>|</span><span>MADE LIKE WE'RE FEEDING FAMILY</span><span>|</span><span>ORDER ONLINE - READY IN 15 MIN</span><span>|</span><span>REAL FLAVOUR. REAL VALUE.</span><span>|</span>
          <span>HAAR DAILY</span><span>|</span><span>EST. 2021 - BENONI, GAUTENG</span><span>|</span><span>KOTAS FROM R20</span><span>|</span><span>MADE LIKE WE'RE FEEDING FAMILY</span><span>|</span><span>ORDER ONLINE - READY IN 15 MIN</span><span>|</span><span>REAL FLAVOUR. REAL VALUE.</span><span>|</span>
        </div>
      </div>

      <header className="ck-dk-header">
        <div className="ck-dk-brand">
          <CKMark size={40} variant="gradient" />
          <div>
            <div className="ck-dk-brand-name">CeeKay Emporium</div>
            <div className="ck-dk-brand-sub">BENONI | CLOSED</div>
          </div>
        </div>
        <div className="ck-dk-header-actions">
          <button onClick={() => { haptics.light(); openGoogleMaps(store); }} className="ck-dk-store-pill">
            <MapPin size={16} /> {store?.branch || 'Locate Us'}
          </button>
          <button className="ck-dk-cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingCart size={18} /> <span className="ck-dk-cart-count">{count}</span>
          </button>
        </div>
      </header>

      <main style={{ position: 'relative', overflow: 'hidden' }}>
        
        {/* DESKTOP 3D BACKGROUND - Pure CSS Gradient */}
        <motion.div 
          animate={{ y: [0, -20, 0], scale: [1, 1.02, 1], rotate: [0, 1, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="ck-dk-3d-bg"
        />

        <section className="ck-dk-hero" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div className="ck-dk-hero-label">EST. 2021 | BENONI, GAUTENG</div>
            <h1 className="ck-dk-hero-title">Benoni's <br/> <span>Kota Spot</span></h1>
            <p className="ck-dk-hero-subtitle">Handcrafted, packed with achaar, and made like we're feeding our own family. From R20.</p>
            
            <div className="ck-dk-hero-ctas">
              <button className="ck-dk-btn-primary" onClick={scrollToMenu}>SEE THE MENU</button>
              <button className="ck-dk-btn-secondary" onClick={() => setCartOpen(true)}>START AN ORDER</button>
            </div>
          </motion.div>

          <motion.div className="ck-dk-features-row" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="ck-dk-feature-card"><div className="ck-dk-feature-icon"><Leaf size={22} /></div><div><div className="ck-dk-feature-title">Real ingredients</div><div className="ck-dk-feature-desc">No shortcuts</div></div></div>
            <div className="ck-dk-feature-card"><div className="ck-dk-feature-icon"><Flame size={22} /></div><div><div className="ck-dk-feature-title">Cooked to order</div><div className="ck-dk-feature-desc">Never pre-made</div></div></div>
            <div className="ck-dk-feature-card"><div className="ck-dk-feature-icon"><Clock size={22} /></div><div><div className="ck-dk-feature-title">Ready in ~15 min</div><div className="ck-dk-feature-desc">Fresh & fast</div></div></div>
            <div className="ck-dk-feature-card"><div className="ck-dk-feature-icon"><MapPin size={22} /></div><div><div className="ck-dk-feature-title">Benoni, Gauteng</div><div className="ck-dk-feature-desc">Since 2021</div></div></div>
          </motion.div>
        </section>

        <div className="ck-dk-main" ref={menuRef} style={{ position: 'relative', zIndex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>Loading menu...</div>
          ) : (
            <>
              <h2 className="ck-dk-category-title">Signature Kotas</h2>
              <motion.div className="ck-dk-grid" variants={containerVariants} initial="hidden" animate="show">
                {menu.kotas.map(item => (
                  <motion.div key={item.id} variants={cardVariants} whileHover={{ y: -8, scale: 1.01 }} onClick={() => { haptics.light(); setModalItem(item); }} className="ck-dk-card">
                    <div className="ck-dk-card-img"><ItemImage src={item.image} alt={item.name} /></div>
                    <div className="ck-dk-card-body">
                      <h3 className="ck-dk-card-title">{item.name}</h3>
                      <p className="ck-dk-card-desc">{item.desc}</p>
                      <div className="ck-dk-card-price">R {item.price}</div>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} className="ck-dk-add-btn" onClick={(e) => { e.stopPropagation(); addToCart(item, { qty: 1 }); haptics.medium(); }}>
                      <Plus size={22} strokeWidth={3} />
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </main>

      <AnimatePresence>
        {cartOpen && <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />}
        {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} onConfirm={handleModalConfirm} />}
      </AnimatePresence>
    </div>
  );
}
