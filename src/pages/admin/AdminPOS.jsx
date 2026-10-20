import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ScanLine, LogOut, Plus, Minus, LayoutDashboard, Trash2, Smartphone, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getMenu } from '../../services/menuService';
import { useHaptics } from '../../hooks/useHaptics';
import { playSuccess, playError } from '../../lib/chime';
import QrScannerModal from '../../components/admin/QrScannerModal';
import ScannedOrderModal from '../../components/admin/ScannedOrderModal';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import CKMark from '../../components/CKMark';
import ItemImage from '../../components/ItemImage';

export default function AdminPOS() {
  const { signOut, user } = useAuth();
  const { store } = useStore();
  const navigate = useNavigate();
  
  const [menu, setMenu] = useState({});
  const [activeCategory, setActiveCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMods, setSelectedMods] = useState([]);
  const [qty, setQty] = useState(1);
  
  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'card'
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  
  const [showScanner, setShowScanner] = useState(false);
  const [scannedOrder, setScannedOrder] = useState(null);
  
  const haptics = useHaptics();

  useEffect(() => { 
    getMenu().then(data => {
      setMenu(data);
      const cats = Object.keys(data).filter(k => data[k].length > 0);
      if (cats.length > 0) setActiveCategory(cats[0]);
    }); 
  }, []);

  const handleLogout = () => { signOut(); navigate('/login'); };

  const addToCart = (item, mods = [], quantity = 1) => {
    haptics.success();
    const modString = mods.map(m => m.id).sort().join(',');
    
    setCart(prev => {
      const existingLine = prev.find(line => 
        line.baseItem.id === item.id && line.modString === modString
      );

      if (existingLine) {
        return prev.map(line => 
          line === existingLine 
            ? { ...line, qty: line.qty + quantity, totalPrice: line.totalPrice + (line.totalPrice / line.qty * quantity) } 
            : line
        );
      }

      const modsTotal = mods.reduce((sum, mod) => sum + Number(mod.sell_price), 0);
      const unitPrice = Number(item.price) + modsTotal;
      
      return [...prev, { 
        baseItem: item, 
        mods: mods, 
        modString: modString,
        qty: quantity,
        totalPrice: unitPrice * quantity 
      }];
    });
  };

  const handleItemTap = (item) => { 
    haptics.light(); 
    if (!item.available_modifiers || item.available_modifiers.length === 0) {
      addToCart(item);
      return;
    }
    setSelectedItem(item); 
    setSelectedMods([]);
    setQty(1);
  };

  const toggleMod = (mod) => {
    haptics.light();
    setSelectedMods(prev => prev.find(m => m.id === mod.id) ? prev.filter(m => m.id !== mod.id) : [...prev, mod]);
  };

  const confirmModifiers = () => {
    addToCart(selectedItem, selectedMods, qty);
    setSelectedItem(null);
  };

  const updateCartQty = (index, delta) => {
    haptics.light();
    setCart(prev => prev.map((line, i) => {
      if (i === index) {
        const newQty = Math.max(1, line.qty + delta);
        const unitPrice = line.totalPrice / line.qty; 
        return { ...line, qty: newQty, totalPrice: unitPrice * newQty };
      }
      return line;
    }));
  };

  const removeCartItem = (index) => {
    haptics.light();
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const calculateCartTotal = () => cart.reduce((sum, line) => sum + line.totalPrice, 0);
  const totalItems = cart.reduce((sum, line) => sum + line.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!store || !store.id) { alert("Error: No active store."); return; }

    setIsCheckingOut(true);
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        store_id: store.id,
        channel: 'pos', 
        customer: { name: 'Walk-in', phone: 'N/A' }, 
        items: cart.map(c => ({ 
            name: c.baseItem.name, 
            qty: c.qty, 
            price: c.baseItem.price, 
            mods: c.mods,
            total: c.totalPrice
        })), 
        total: calculateCartTotal(), 
        status: 'completed', 
        note: `Cashier: ${user?.email?.split('@')[0] || 'Staff'}`
      }).select().single();
      
      if (error) throw error;

      await supabase.from('journal').insert({ 
        order_id: order.id, 
        cashier_name: user?.email || 'Staff', 
        action: 'sale', 
        amount: calculateCartTotal(), 
        payment_method: paymentMethod 
      });

      playSuccess(); 
      haptics.success();
      setCheckoutSuccess(true);
      setCart([]);
      
      setTimeout(() => setCheckoutSuccess(false), 3000);
    } catch (err) {
      console.error(err); 
      playError(); 
      haptics.error(); 
      alert(`Failed: ${err.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: '#f4f5f7', display: 'flex', flexDirection: 'column' }}>
      
      {/* TAILORED HEADER */}
      <header style={{ background: 'white', padding: '16px 24px', borderBottom: '1px solid var(--ck-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <CKMark size={36} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '20px', color: 'var(--ck-brand-deep)', fontFamily: 'var(--ck-font-display)' }}>POS Terminal</div>
            <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 700 }}>{store?.branch || 'CeeKay'}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowScanner(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--ck-warm)', border: 'none', color: 'var(--ck-charcoal)', fontWeight: 900, cursor: 'pointer', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', boxShadow: '0 4px 12px rgba(212,149,43,0.2)' }}>
            <ScanLine size={18} /> Scan QR
          </button>
          <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(229, 57, 53, 0.1)', border: 'none', color: 'var(--ck-achaar-red)', fontWeight: 800, cursor: 'pointer', padding: '12px 20px', borderRadius: '12px', fontSize: '14px' }}>
            <LayoutDashboard size={18} /> Exit
          </button>
        </div>
      </header>

      {/* CATEGORY TABS */}
      <div style={{ background: 'white', padding: '0 24px', display: 'flex', gap: '12px', overflowX: 'auto', borderBottom: '1px solid var(--ck-border)', flexShrink: 0 }}>
        {Object.keys(menu).map(key => {
          if (!menu[key] || menu[key].length === 0) return null;
          const isActive = activeCategory === key;
          return (
            <button 
              key={key} 
              onClick={() => setActiveCategory(key)}
              style={{ 
                padding: '16px 24px', background: 'transparent', border: 'none', 
                borderBottom: isActive ? '4px solid var(--ck-brand-deep)' : '4px solid transparent',
                color: isActive ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)',
                fontWeight: 900, fontSize: '15px', textTransform: 'capitalize', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {key}
            </button>
          );
        })}
      </div>

      {/* MAIN POS BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {(menu[activeCategory] || []).map(item => (
            <motion.div 
              whileHover={{ y: -4, boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.98 }}
              key={item.id} 
              onClick={() => handleItemTap(item)} 
              style={{ background: 'white', border: '1px solid var(--ck-border)', borderRadius: '24px', padding: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', position: 'relative', transition: 'box-shadow 0.2s' }}
            >
              <div style={{ width: '100%', height: '120px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', background: 'var(--ck-cream)' }}>
                <ItemImage src={item.image} alt={item.name} />
              </div>
              
              <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--ck-ink)', marginBottom: '4px', lineHeight: 1.2 }}>{item.name}</div>
              <div style={{ color: 'var(--ck-brand-deep)', fontWeight: 900, fontSize: '18px', marginTop: 'auto' }}>R {item.price}</div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,46,74,0.3)' }}
              >
                <Plus size={22} strokeWidth={3} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* TAILORED DOCKED TILL CART */}
      <div style={{ flexShrink: 0, background: 'white', borderTop: '2px solid var(--ck-border)', display: 'flex', flexDirection: 'column', maxHeight: '50vh', boxShadow: '0 -10px 40px rgba(0,0,0,0.08)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#fafafa', borderBottom: '1px solid var(--ck-border)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'var(--ck-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Current Order 
            <span style={{ background: 'var(--ck-brand-deep)', color: 'white', padding: '2px 10px', borderRadius: '99px', fontSize: '12px' }}>{totalItems}</span>
          </h3>
          <button onClick={() => setCart([])} style={{ background: 'transparent', color: 'var(--ck-achaar-red)', border: 'none', fontSize: '13px', fontWeight: 900, cursor: 'pointer', padding: '8px' }}>Clear All</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          {checkoutSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--ck-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}><Check size={32} color="white" /></div>
              <h3 style={{ margin: 0, color: 'var(--ck-ink)', fontSize: '20px' }}>Sale Complete!</h3>
            </div>
          ) : cart.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ck-ink-soft)', fontSize: '15px', fontStyle: 'italic', fontWeight: 600 }}>Tap items above to start an order.</div>
          ) : (
            cart.map((line, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--ck-cream)' }}>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--ck-ink)' }}>{line.baseItem.name}</div>
                  {line.mods.length > 0 && <div style={{ fontSize: '13px', color: 'var(--ck-brand-deep)', fontWeight: 700, marginTop: '4px' }}>{line.mods.map(m => m.name).join(', ')}</div>}
                  <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--ck-ink)', marginTop: '6px' }}>R {line.totalPrice.toFixed(2)}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* CUSTOM QTY CONTROLS */}
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ck-cream)', borderRadius: '12px', padding: '4px', border: '1px solid var(--ck-border)' }}>
                    <button onClick={() => updateCartQty(i, -1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Minus size={16} /></button>
                    <span style={{ width: '36px', textAlign: 'center', fontWeight: 900, fontSize: '16px' }}>{line.qty}</span>
                    <button onClick={() => updateCartQty(i, 1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Plus size={16} /></button>
                  </div>
                  <button onClick={() => removeCartItem(i)} style={{ background: 'rgba(229, 57, 53, 0.1)', color: 'var(--ck-achaar-red)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}><Trash2 size={20} /></button>
                </div>

              </div>
            ))
          )}
        </div>

        {!checkoutSuccess && (
          <div style={{ padding: '20px 24px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', background: 'var(--ck-cream)', borderTop: '2px solid var(--ck-border)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: '18px', color: 'var(--ck-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total to pay</span>
              <span style={{ fontWeight: 900, fontSize: '36px', color: 'var(--ck-ink)' }}>R {calculateCartTotal().toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              
              {/* CUSTOM PAYMENT TOGGLE (No native select) */}
              <div style={{ display: 'flex', background: 'white', borderRadius: '16px', padding: '4px', border: '1px solid var(--ck-border)', flex: 1 }}>
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: paymentMethod === 'cash' ? 'var(--ck-brand-deep)' : 'transparent', color: paymentMethod === 'cash' ? 'white' : 'var(--ck-ink-soft)', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                >
                  <Banknote size={16} /> Cash
                </button>
                <button 
                  onClick={() => setPaymentMethod('card')}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: paymentMethod === 'card' ? 'var(--ck-brand-deep)' : 'transparent', color: paymentMethod === 'card' ? 'white' : 'var(--ck-ink-soft)', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                >
                  <Smartphone size={16} /> Card
                </button>
              </div>

              <button onClick={handleCheckout} disabled={isCheckingOut || cart.length === 0} style={{ background: 'var(--ck-brand-deep)', color: 'white', padding: '0 32px', borderRadius: '16px', fontWeight: 900, border: 'none', flex: 2, fontSize: '18px', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.5 : 1, boxShadow: '0 4px 15px rgba(15,46,74,0.2)' }}>
                {isCheckingOut ? 'Processing...' : 'Charge'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODIFIER MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px', zIndex: 1001, maxHeight: '85vh', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto', boxShadow: '0 -10px 50px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>{selectedItem.name}</h2>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ck-brand-deep)' }}>Base: R {selectedItem.price}</div>
                </div>
                <button onClick={() => setSelectedItem(null)} style={{ background: 'var(--ck-cream)', border: 'none', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px' }}>
                {selectedItem.available_modifiers?.length > 0 && (
                  <>
                    <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--ck-ink-soft)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Add Extras</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {selectedItem.available_modifiers.map(mod => {
                        const isSelected = selectedMods.find(m => m.id === mod.id);
                        return (
                          <button key={mod.id} onClick={() => toggleMod(mod)} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderRadius: '16px', border: `2px solid ${isSelected ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, background: isSelected ? 'var(--ck-cream)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontWeight: 800, color: 'var(--ck-ink)', fontSize: '15px' }}>{mod.name}</span>
                            <span style={{ color: 'var(--ck-brand-deep)', fontWeight: 900 }}>+ R{mod.sell_price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ck-cream)', borderRadius: '16px', padding: '4px', border: '1px solid var(--ck-border)' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '48px', height: '48px', borderRadius: '12px', border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Minus size={20} /></button>
                  <span style={{ width: '48px', textAlign: 'center', fontWeight: 900, fontSize: '20px' }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} style={{ width: '48px', height: '48px', borderRadius: '12px', border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Plus size={20} /></button>
                </div>
                <button onClick={confirmModifiers} style={{ flex: 1, background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '16px', fontWeight: 900, border: 'none', fontSize: '18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', boxShadow: '0 4px 15px rgba(15,46,74,0.2)' }}>
                  <span>Add to Order</span>
                  <span>R {((Number(selectedItem.price) + selectedMods.reduce((s, m) => s + Number(m.sell_price), 0)) * qty).toFixed(2)}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SCANNER MODALS */}
      <AnimatePresence>
        {showScanner && (
          <QrScannerModal onClose={() => setShowScanner(false)} onOrderFound={(order) => { setScannedOrder(order); setShowScanner(false); }} />
        )}
        {scannedOrder && (
          <ScannedOrderModal order={scannedOrder} onClose={() => setScannedOrder(null)} onSuccess={() => { setScannedOrder(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}