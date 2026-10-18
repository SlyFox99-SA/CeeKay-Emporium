import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMenu } from '../../services/menuService';
import { useHaptics } from '../../hooks/useHaptics';
import { playSuccess, playError } from '../../lib/chime';

export default function AdminPOS() {
  const [menu, setMenu] = useState({ kotas: [], drinks: [] });
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMods, setSelectedMods] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const haptics = useHaptics();

  useEffect(() => { getMenu().then(setMenu); }, []);

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
      const { data: order, error } = await supabase.from('orders').insert({
        channel: 'pos', customer: { name: 'Walk-in', phone: 'N/A' }, items: cart, total: calculateCartTotal(), status: 'completed', note: `Cashier: Gift`
      }).select().single();
      if (error) throw error;

      await supabase.from('journal').insert({ order_id: order.id, cashier_name: 'Gift', action: 'sale', amount: calculateCartTotal(), payment_method: paymentMethod });

      setCart([]); setIsCheckingOut(false); playSuccess(); haptics.success();
    } catch (err) {
      console.error(err); playError(); haptics.error(); setIsCheckingOut(false);
    }
  };

  return (<div style={{ padding: '24px 20px', paddingBottom: '140px' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Terminal</div>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Cashier POS</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {menu.kotas.map(item => (
          <button key={item.id} onClick={() => handleItemTap(item)} style={{ background: 'white', border: '1px solid var(--ck-border)', borderRadius: '16px', padding: '16px', textAlign: 'left', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ck-ink)' }}>{item.name}</div>
            <div style={{ color: 'var(--ck-brand-deep)', fontWeight: 600, marginTop: '8px' }}>R {item.price}</div>
          </button>
        ))}
      </div>

      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '16px 20px', borderTop: '1px solid var(--ck-border)', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700 }}>{cart.length} Items</span>
            <span style={{ fontWeight: 800, fontSize: '18px' }}>R {calculateCartTotal().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--ck-border)', flex: 1 }}>
              <option value="cash">Cash</option>
              <option value="speedpoint">Speed Point</option>
            </select>
            <button onClick={handleCheckout} disabled={isCheckingOut} style={{ background: 'var(--ck-brand-deep)', color: 'white', padding: '0 24px', borderRadius: '12px', fontWeight: 700, border: 'none', flex: 2 }}>
              {isCheckingOut ? '...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', zIndex: 1001, maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedItem.name}</h2>
                <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {selectedItem.available_modifiers?.map(mod => {
                  const isSelected = selectedMods.find(m => m.id === mod.id);
                  return (
                    <button key={mod.id} onClick={() => toggleMod(mod)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', border: `1px solid ${isSelected ? 'var(--ck-brand-deep)' : 'var(--ck-border)'}`, background: isSelected ? 'var(--ck-cream)' : 'white', cursor: 'pointer' }}>
                      <span style={{ fontWeight: 600 }}>{mod.name}</span>
                      <span style={{ color: 'var(--ck-brand-deep)', fontWeight: 700 }}>+ R{mod.sell_price}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={addToCart} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', borderRadius: '16px', fontWeight: 700, border: 'none' }}>
                Add to Order — R {(Number(selectedItem.price) + selectedMods.reduce((s, m) => s + Number(m.sell_price), 0)).toFixed(2)}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}