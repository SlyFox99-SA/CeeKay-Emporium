import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useHaptics } from '../hooks/useHaptics';
import { getMenu } from '../services/menuService';
import ItemImage from '../components/ItemImage';
import CartSidebar from '../components/CartSidebar';
import ItemModal from '../components/ItemModal';
import CKMark from '../components/CKMark';
import StoreSelector from '../components/StoreSelector';

export default function Storefront() {
  const [menu, setMenu] = useState({ kotas: [], drinks: [] });
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  
  const { addToCart, count } = useCart();
  const haptics = useHaptics();

  useEffect(() => {
    getMenu().then(data => {
      setMenu(data);
      setLoading(false);
    });
  }, []);

  const handleModalConfirm = (item, options) => {
    addToCart(item, options);
    setModalItem(null);
  };

  return (
    <div style={{ background: 'var(--ck-cream)', minHeight: '100vh', paddingBottom: '100px' }}>
      <header style={{ background: 'white', borderBottom: '1px solid var(--ck-border)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 900, color: 'var(--ck-brand-deep)' }}>
          <CKMark size={32} /> CeeKay Emporium
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <StoreSelector />
          <button onClick={() => setCartOpen(true)} style={{ background: 'var(--ck-brand-deep)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '99px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <ShoppingBag size={18} /> Cart ({count})
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 40px' }}>
        {loading ? (
          <div>Loading menu...</div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '32px', marginBottom: '24px' }}>Signature Kotas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
              {menu.kotas.map(item => (
                <div key={item.id} onClick={() => setModalItem(item)} style={{ background: 'white', borderRadius: '24px', padding: '20px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ height: '180px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                    <ItemImage src={item.image} alt={item.name} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>{item.name}</h3>
                  <p style={{ margin: '0 0 16px', color: 'var(--ck-ink-soft)', fontSize: '14px' }}>{item.desc}</p>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>R {item.price}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {cartOpen && <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />}
      {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} onConfirm={handleModalConfirm} />}
    </div>
  );
}