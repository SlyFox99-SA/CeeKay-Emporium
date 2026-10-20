import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ScanLine, LogOut, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getMenu } from '../../services/menuService';
import { useHaptics } from '../../hooks/useHaptics';
import { playSuccess, playError } from '../../lib/chime';
import QrScannerModal from '../../components/admin/QrScannerModal';
import ScannedOrderModal from '../../components/admin/ScannedOrderModal';
import { useAuth } from '../../context/AuthContext';
import CKMark from '../../components/CKMark';

export default function AdminPOS() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const [menu, setMenu] = useState({ kotas: [], drinks: [] });
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMods, setSelectedMods] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  const [showScanner, setShowScanner] = useState(false);
  const [scannedOrder, setScannedOrder] = useState(null);
  
  const haptics = useHaptics();

  useEffect(() => { getMenu().then(setMenu); }, []);

  const handleLogout = () => { signOut(); navigate('/login'); };

  const handleItemTap = (item) => { haptics.light(); setSelectedItem(item); setSelectedMods([]); };

  const toggleMod = (mod) => {
    haptics.light();
    setSelectedMods(prev => prev.find(m => m.id === mod.id) ? prev.filter(m => m.id !== mod.id) : [...prev, mod]);
  };

  const addToCart = () => {
    haptics.success();
    const modsTotal = selectedMods.reduce((sum, mod) => sum + Number(mod.sell_price), 0);
    setCart(prev => [...prev, { baseItem: selectedItem, mods: selectedMods, totalPrice: Number(selectedItem.price) + modsTotal }]);
    setSelectedItem(null);
  };

  const calculateCartTotal = () => cart.reduce((sum, line) => sum + line.totalPrice, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      // 1. Create Order
      const { data: order, error } = await supabase.from('orders').insert({
        channel: 'pos', customer: { name: 'Walk-in', phone: 'N/A' }, items: cart, total: calculateCartTotal(), status: 'completed', note: `Cashier: ${user?.email?.split('@')[0] || 'Staff'}`
      }).select().single();
      if (error) throw error;

      // 2. Log Journal
      await supabase.from('journal').insert({ order_id: order.id, cashier_name: user?.email || 'Staff', action: 'sale', amount: calculateCartTotal(), payment_method: paymentMethod });

      setCart([]); setIsCheckingOut(false); playSuccess(); haptics.success();
      alert('Sale Completed Successfully!');
    } catch (err) {
      console.error(err); playError(); haptics.error(); setIsCheckingOut(false);
      alert('Failed to process sale.');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--ck-cream)', display: 'flex', flexDirection: 'column' }}>
      
      {/* POS HEADER */}
      <header style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid var(--ck-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CKMark size={28} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--ck-ink)' }}>Cashier POS</div>
            <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)' }}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--ck-achaar-red)', fontWeight: 700, cursor: 'pointer' }}>
          <LogOut size={18} /> End Shift
        </button>
      </header>

      {/* MAIN POS BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '120px' }}>
        
        <button onClick={() => setShowScanner(true)} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15,46,74,0.2)', marginBottom: '24px', cursor: 'pointer' }}>
          <ScanLine size={20} /> Scan Collection QR
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {menu.kotas.map(item => (
            <button key={item.id} onClick={() => handleItemTap(item)} style={{ background: 'white', border: '1px solid var(--ck-border)', borderRadius: '16px', padding: '16px', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-ink)', marginBottom: '8px' }}>{item.name}</div>
              <div style={{ color: 'var(--ck-brand-deep)', fontWeight: 800 }}>R {item.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* STICKY CART */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '16px 20px', borderTop: '1px solid var(--ck-border)', zIndex: 100, boxShadow: '0 -10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ck-ink)' }}>{cart.length} Items</span>
            <span style={{ fontWeight: 900, fontSize: '20px', color: 'var(--ck-brand-deep)' }}>R {calculateCartTotal().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', flex: 1, fontSize: '15px', fontWeight: 600, outline: 'none' }}>
              <option value="cash">Cash</option>
              <option value="speedpoint">Speed Point</option>
            </select>
            <button onClick={handleCheckout} disabled={isCheckingOut} style={{ background: 'var(--ck-brand-deep)', color: 'white', padding: '0 24px', borderRadius: '12px', fontWeight: 800, border: 'none', flex: 2, fontSize: '16px', cursor: 'pointer' }}>
              {isCheckingOut ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      )}

      {/* MODIFIER MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 1001, maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--ck-ink)' }}>{selectedItem.name}</h2>
                <button onClick={() => setSelectedItem(null)} style={{ background: 'var(--ck-cream)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {selectedItem.available_modifiers?.map(mod => {
                  const isSelected = selectedMods.find(m => m.id === mod.id);
                  return (
                    <button key={mod.id} onClick={() => toggleMod(mod)} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: `2px solid ${isSelected ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, background: isSelected ? 'var(--ck-cream)' : 'white', cursor: 'pointer' }}>
                      <span style={{ fontWeight: 600 }}>{mod.name}</span>
                      <span style={{ color: 'var(--ck-brand-deep)', fontWeight: 800 }}>+ R{mod.sell_price}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={addToCart} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '16px', fontWeight: 800, border: 'none', fontSize: '16px', cursor: 'pointer' }}>
                Add to Order — R {(Number(selectedItem.price) + selectedMods.reduce((s, m) => s + Number(m.sell_price), 0)).toFixed(2)}
              </button>
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