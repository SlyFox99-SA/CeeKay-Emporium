import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowLeft, User, Phone, Clock, Check, Package, ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { usePrefs } from '../context/PreferencesContext';
import { createOrder } from '../services/orderService';
import { recordOrder, saveProfile } from '../services/customerService';
import { burstConfetti } from '../lib/confetti';
import { playSuccess, playError } from '../lib/chime';
import ItemImage from './ItemImage';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';
import { useHaptics } from '../hooks/useHaptics';

const CUSTOMER_KEY = 'ceekay-customer';
const PICKUP_OPTIONS = ['As soon as possible', 'In 15 minutes', 'In 30 minutes', 'In 1 hour'];

export default function CartSidebar({ open, onClose, onToast, onToastAction }) {
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();
  
  const [step, setStep] = useState('cart');
  const [note, setNote] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || { name: '', phone: '', pickupTime: PICKUP_OPTIONS[0] };
    } catch {
      return { name: '', phone: '', pickupTime: PICKUP_OPTIONS[0] };
    }
  });

  const { cart, changeQty, removeItem, restoreLine, clearCart, total, count, lineKey } = useCart();
  const { store } = useStore();
  const { prefs } = usePrefs();

  useEffect(() => {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  }, [customer]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => setStep('cart'), 300);
    }
  }, [open]);

  const updateCustomer = (field, value) => setCustomer(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!customer.name.trim()) { if (prefs.sound) playError(); haptics.error(); onToast('Please enter your name'); return false; }
    if (!customer.phone.trim()) { if (prefs.sound) playError(); haptics.error(); onToast('Please enter your phone number'); return false; }
    return true;
  };

  const buildText = (orderId) => {
    const lines = [`${store?.name ?? 'CeeKay'} — ${store?.branch ?? ''}`, ''];
    if (orderId) lines.push(`Order #${orderId}`, '');
    lines.push(`Name: ${customer.name}`, `Phone: ${customer.phone}`, `Pickup: ${customer.pickupTime}`, '');
    cart.forEach(i => lines.push(`${i.name} x${i.qty} — R${(i.price * i.qty).toFixed(2)}`));
    lines.push('', `Total: R${total.toFixed(2)}`);
    if (note.trim()) lines.push('', `Notes: ${note.trim()}`);
    return lines.join('\n');
  };

  const finishOrder = (order) => {
    setLastOrder(order);
    setStep('success');
    if (prefs.sound) playSuccess();
    if (prefs.confetti) burstConfetti();
    haptics.success();
    clearCart();
    setNote('');
  };

  const orderWhatsApp = async () => {
    if (!store || !cart.length || !validate()) return;
    const order = await createOrder({ store, cart, customer, note, channel: 'whatsapp', total });
    recordOrder(order); saveProfile({ name: customer.name, phone: customer.phone });
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(buildText(order.id))}`, '_blank');
    finishOrder(order);
  };

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      
      <motion.aside 
        className={`cart-side ${open ? 'open' : ''}`}
        initial={{ y: "100%" }}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        
        <div className="cart-head" {...swipeProps} style={{ touchAction: 'none' }}>
          <h3>{step === 'cart' ? 'Your Order' : step === 'details' ? 'Checkout' : 'Success'}</h3>
          <button className="cart-close" onClick={onClose}><X size={20} /></button>
        </div>

        {store && step !== 'success' && (
          <div className="cart-store-banner">
            <MapPin size={13} /> Ordering from <strong>{store.branch}</strong>
          </div>
        )}

        {step === 'cart' && (
          <>
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingBag size={40} />
                  <h4>Your cart is empty</h4>
                </div>
              ) : cart.map(item => {
                const key = lineKey(item);
                return (
                  <div key={key} className="cart-item">
                    <span className="c-thumb"><ItemImage src={item.image} alt={item.name} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="c-name">{item.name}</div>
                      <div className="c-unit-price">R {item.price.toFixed(2)} each</div>
                      <div className="c-qty-row">
                        <button className="qty-btn" onClick={() => { changeQty(key, -1); haptics.light(); }}><Minus size={14} /></button>
                        <span className="qty-val">{item.qty}</span>
                        <button className="qty-btn" onClick={() => { changeQty(key, 1); haptics.light(); }}><Plus size={14} /></button>
                      </div>
                    </div>
                    <div className="c-line-total">R {(item.price * item.qty).toFixed(2)}</div>
                    <button className="c-remove" onClick={() => { removeItem(key); haptics.light(); }}><X size={16} /></button>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <div className="cart-foot">
                <div className="price-breakdown">
                  <div className="price-row"><span>Subtotal</span><span>R {total.toFixed(2)}</span></div>
                  <div className="price-row price-row-total"><span>Total</span><strong>R {total.toFixed(2)}</strong></div>
                </div>
                <button className="order-btn primary" onClick={() => { setStep('details'); haptics.medium(); }}>Continue to checkout</button>
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <>
            <div className="cart-items">
              <button className="cart-back" onClick={() => setStep('cart')}><ArrowLeft size={16} /> Back to cart</button>
              
              <div className="checkout-summary">
                <div className="checkout-summary-title">Order Summary</div>
                {cart.map(item => (
                  <div key={lineKey(item)} className="checkout-summary-row">
                    <span className="cs-qty">{item.qty}x</span>
                    <span className="cs-name">{item.name}</span>
                    <span className="cs-price">R {(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mobile-form-group">
                <label className="field">
                  <span className="field-label"><User size={12} /> Name</span>
                  <input type="text" placeholder="Bongani" value={customer.name} onChange={e => updateCustomer('name', e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label"><Phone size={12} /> Phone</span>
                  <input type="tel" placeholder="082 123 4567" value={customer.phone} onChange={e => updateCustomer('phone', e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label"><Clock size={12} /> Pickup Time</span>
                  <select value={customer.pickupTime} onChange={e => updateCustomer('pickupTime', e.target.value)}>
                    {PICKUP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Notes</span>
                  <textarea placeholder="Extra achaar..." value={note} onChange={e => setNote(e.target.value)} />
                </label>
              </div>
            </div>
            <div className="cart-foot">
              <div className="price-breakdown">
                <div className="price-row price-row-total"><span>Total to pay</span><strong>R {total.toFixed(2)}</strong></div>
              </div>
              <button className="order-btn whatsapp" onClick={orderWhatsApp}>Order on WhatsApp</button>
            </div>
          </>
        )}

        {step === 'success' && lastOrder && (
          <div className="cart-items" style={{ textAlign: 'center', paddingTop: 60 }}>
            <Check size={64} color="var(--ck-brand)" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: 32 }}>Order placed!</h2>
            <p style={{ color: 'var(--ck-ink-muted)' }}>We'll have it ready soon.</p>
            <button className="order-btn primary" onClick={onClose} style={{ marginTop: 40 }}>Done</button>
          </div>
        )}
      </motion.aside>
    </>
  );
}