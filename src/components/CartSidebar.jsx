import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Minus, Plus, Check, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { usePrefs } from '../context/PreferencesContext';
import { createOrder } from '../services/orderService';
import { recordOrder, saveProfile } from '../services/customerService';
import { burstConfetti } from '../lib/confetti';
import { playSuccess, playError } from '../lib/chime';
import ItemImage from './ItemImage';

const PICKUP_OPTIONS = ['As soon as possible', 'In 15 minutes', 'In 30 minutes', 'In 1 hour'];

export default function CartSidebar({ open, onClose, onToast }) {
  const [step, setStep] = useState('cart');
  const [customer, setCustomer] = useState({ name: '', phone: '', pickupTime: PICKUP_OPTIONS[0] });
  const [isPlacing, setIsPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [note, setNote] = useState('');

  const { cart, changeQty, removeItem, clearCart, total, count, lineKey } = useCart();
  const { store } = useStore();
  const { prefs } = usePrefs();

  const validate = () => {
    if (!customer.name.trim()) { if (prefs.sound) playError(); onToast?.('Please enter your name'); return false; }
    if (!customer.phone.trim()) { if (prefs.sound) playError(); onToast?.('Please enter your phone number'); return false; }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!store || !cart.length || !validate()) return;
    setIsPlacing(true);
    try {
      const order = await createOrder({ store, cart, customer, note, channel: 'app', total });
      recordOrder(order);
      saveProfile({ name: customer.name, phone: customer.phone });
      setLastOrder(order);
      setStep('success');
      if (prefs.sound) playSuccess();
      if (prefs.confetti) burstConfetti();
      clearCart();
      setNote('');
    } catch (err) {
      onToast?.('Failed to place order.');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="ck-dk-cart-overlay"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="ck-dk-cart-panel"
          >
            <header className="ck-dk-cart-header">
              <h2>
                {step === 'cart' && `Your Order (${count})`}
                {step === 'details' && 'Checkout'}
                {step === 'success' && 'Success'}
              </h2>
              <button className="ck-dk-cart-close" onClick={onClose}>
                <X size={20} />
              </button>
            </header>

            <div className="ck-dk-cart-body">
              {step === 'cart' && (
                <>
                  {cart.length === 0 ? (
                    <div className="ck-dk-cart-empty">
                      <ShoppingBag size={48} strokeWidth={1} />
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 4px', color: 'var(--ck-ink)' }}>Your cart is empty</h3>
                        <p style={{ margin: 0, fontSize: '14px' }}>Add a kota to get started.</p>
                      </div>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={lineKey(item)} className="ck-dk-cart-item">
                        <div className="ck-dk-cart-item-img">
                          <ItemImage src={item.image} alt={item.name} />
                        </div>
                        <div className="ck-dk-cart-item-info">
                          <div>
                            <div className="ck-dk-cart-item-title">{item.name}</div>
                            {item.modifiers?.length > 0 && (
                              <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '2px' }}>
                                {item.modifiers.map(m => m.name).join(', ')}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="ck-dk-cart-item-qty">
                              <button className="ck-dk-cart-qty-btn" onClick={() => changeQty(lineKey(item), -1)}><Minus size={14} /></button>
                              <span style={{ fontWeight: 700, fontSize: '14px', width: '16px', textAlign: 'center' }}>{item.qty}</span>
                              <button className="ck-dk-cart-qty-btn" onClick={() => changeQty(lineKey(item), 1)}><Plus size={14} /></button>
                            </div>
                            <span className="ck-dk-cart-item-price">R {(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        </div>
                        <button className="ck-dk-cart-item-remove" onClick={() => removeItem(lineKey(item))}><X size={16} /></button>
                      </div>
                    ))
                  )}
                </>
              )}

              {step === 'details' && (
                <div className="ck-dk-cart-form">
                  <button onClick={() => setStep('cart')} style={{ background: 'transparent', border: 'none', color: 'var(--ck-ink-soft)', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 0 16px 0', cursor: 'pointer', fontWeight: 600 }}>
                    <ArrowLeft size={16} /> Back to cart
                  </button>
                  <div className="ck-dk-cart-field">
                    <label>Your Name</label>
                    <input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="e.g. Bongani" />
                  </div>
                  <div className="ck-dk-cart-field">
                    <label>Phone Number</label>
                    <input type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="082 123 4567" />
                  </div>
                  <div className="ck-dk-cart-field">
                    <label>When do you want it?</label>
                    <select value={customer.pickupTime} onChange={e => setCustomer({...customer, pickupTime: e.target.value})}>
                      {PICKUP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="ck-dk-cart-field">
                    <label>Notes (optional)</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. extra achaar, no cheese" rows={3} />
                  </div>
                </div>
              )}

              {step === 'success' && lastOrder && (
                <div className="ck-dk-cart-empty" style={{ padding: '40px 0' }}>
                  <div style={{ width: '64px', height: '64px', background: 'var(--ck-green)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={32} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--ck-font-serif)', fontSize: '24px', color: 'var(--ck-ink)' }}>Order placed!</h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>We are preparing it now.</p>
                  </div>
                  <button onClick={onClose} className="ck-dk-cart-checkout" style={{ marginTop: '20px' }}>Done</button>
                </div>
              )}
            </div>

            {step !== 'success' && cart.length > 0 && (
              <footer className="ck-dk-cart-footer">
                <div className="ck-dk-cart-totals">
                  <span>Total</span>
                  <span>R {total.toFixed(2)}</span>
                </div>
                {step === 'cart' ? (
                  <button className="ck-dk-cart-checkout" onClick={() => setStep('details')}>
                    Continue to Checkout
                  </button>
                ) : (
                  <button className="ck-dk-cart-checkout" onClick={handlePlaceOrder} disabled={isPlacing}>
                    {isPlacing ? 'Processing...' : 'Place Order'}
                  </button>
                )}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}