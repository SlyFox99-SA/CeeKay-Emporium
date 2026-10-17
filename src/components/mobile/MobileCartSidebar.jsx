import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, User, Phone, Clock, Check, ShoppingBag, X, Minus, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { usePrefs } from '../../context/PreferencesContext';
import { createOrder } from '../../services/orderService';
import { recordOrder, saveProfile } from '../../services/customerService';
import { burstConfetti } from '../../lib/confetti';
import { playSuccess, playError } from '../../lib/chime';
import ItemImage from '../ItemImage';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';
import { useHaptics } from '../../hooks/useHaptics';

const CUSTOMER_KEY = 'ceekay-customer';
const PICKUP_OPTIONS = ['As soon as possible', 'In 15 minutes', 'In 30 minutes', 'In 1 hour'];

export default function MobileCartSidebar({ open, onClose, onToast }) {
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('cart');
  const [note, setNote] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || { name: '', phone: '', pickupTime: PICKUP_OPTIONS[0] };
    } catch {
      return { name: '', phone: '', pickupTime: PICKUP_OPTIONS[0] };
    }
  });

  const { cart, changeQty, removeItem, clearCart, total, count, lineKey } = useCart();
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
    if (customer.phone.trim().length < 9) { if (prefs.sound) playError(); haptics.error(); onToast('Please enter a valid phone number'); return false; }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!store || !cart.length || !validate() || isPlacing) return;
    
    setIsPlacing(true);
    try {
      const order = await createOrder({ 
        store, 
        cart, 
        customer, 
        note, 
        channel: 'app', 
        total 
      });

      recordOrder(order); 
      saveProfile({ name: customer.name, phone: customer.phone });
      
      setLastOrder(order);
      setStep('success');
      if (prefs.sound) playSuccess();
      if (prefs.confetti) burstConfetti();
      haptics.success();
      
      clearCart();
      setNote('');
    } catch (err) {
      haptics.error();
      onToast('Failed to place order. Please try again.');
      console.error(err);
    } finally {
      setIsPlacing(false);
    }
  };

  const handleTrackOrder = () => {
    if (!lastOrder) return;
    onClose();
    navigate(`/order/${lastOrder.id}`);
  };

  return (
    <>
      <div className={`m-cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      
      <motion.div 
        className="m-cart-sheet"
        initial={{ y: "100%" }}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="m-cart-header" {...swipeProps} style={{ touchAction: 'none' }}>
          <div className="m-sheet-handle" />
          <h2>{step === 'cart' ? 'Your Order' : step === 'details' ? 'Checkout' : 'Success'}</h2>
          <button className="m-cart-close" onClick={onClose}><X size={20} /></button>
        </div>

        {store && step !== 'success' && (
          <div className="m-cart-banner">
            <MapPin size={13} /> Ordering from <strong>{store.branch}</strong>
          </div>
        )}

        {step === 'cart' && (
          <>
            <div className="m-cart-items">
              {cart.length === 0 ? (
                <div className="m-cart-empty">
                  <ShoppingBag size={48} strokeWidth={1.5} />
                  <h3>Your cart is empty</h3>
                  <p>Add a kota to get started.</p>
                </div>
              ) : cart.map(item => {
                const key = lineKey(item);
                return (
                  <div key={key} className="m-cart-item">
                    <div className="m-cart-thumb"><ItemImage src={item.image} alt={item.name} /></div>
                    <div className="m-cart-item-info">
                      <div className="m-cart-item-name">{item.name}</div>
                      <div className="m-cart-item-price">R {item.price.toFixed(2)}</div>
                      <div className="m-cart-qty-row">
                        <button className="m-cart-qty-btn" onClick={() => { changeQty(key, -1); haptics.light(); }}><Minus size={14} /></button>
                        <span className="m-cart-qty-val">{item.qty}</span>
                        <button className="m-cart-qty-btn" onClick={() => { changeQty(key, 1); haptics.light(); }}><Plus size={14} /></button>
                      </div>
                    </div>
                    <div className="m-cart-item-total">R {(item.price * item.qty).toFixed(2)}</div>
                    <button className="m-cart-remove" onClick={() => { removeItem(key); haptics.light(); }}><X size={16} /></button>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <div className="m-cart-footer">
                <div className="m-cart-totals">
                  <span>Total</span>
                  <strong>R {total.toFixed(2)}</strong>
                </div>
                <button className="m-cart-primary-btn" onClick={() => { setStep('details'); haptics.medium(); }}>
                  Continue to checkout
                </button>
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <>
            <div className="m-cart-items">
              <button className="m-cart-back" onClick={() => setStep('cart')}><ArrowLeft size={16} /> Back to cart</button>
              
              <div className="m-checkout-summary">
                <h4>Order Summary</h4>
                {cart.map(item => (
                  <div key={lineKey(item)} className="m-summary-row">
                    <span>{item.qty}x {item.name}</span>
                    <span>R {(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="m-form-group">
                <label className="m-field">
                  <span className="m-label"><User size={12} /> Name</span>
                  <input type="text" placeholder="Bongani" value={customer.name} onChange={e => updateCustomer('name', e.target.value)} />
                </label>
                <label className="m-field">
                  <span className="m-label"><Phone size={12} /> Phone</span>
                  <input type="tel" placeholder="082 123 4567" value={customer.phone} onChange={e => updateCustomer('phone', e.target.value)} />
                </label>
                <label className="m-field">
                  <span className="m-label"><Clock size={12} /> Pickup Time</span>
                  <select value={customer.pickupTime} onChange={e => updateCustomer('pickupTime', e.target.value)}>
                    {PICKUP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
                <label className="m-field">
                  <span className="m-label">Notes</span>
                  <textarea placeholder="Extra achaar..." value={note} onChange={e => setNote(e.target.value)} />
                </label>
              </div>
            </div>
            <div className="m-cart-footer">
              <div className="m-cart-totals">
                <span>Total to pay</span>
                <strong>R {total.toFixed(2)}</strong>
              </div>
              <button className="m-cart-primary-btn" onClick={handlePlaceOrder} disabled={isPlacing}>
                {isPlacing ? <Loader2 size={24} className="spin" /> : 'Place Order'}
              </button>
            </div>
          </>
        )}

        {step === 'success' && lastOrder && (
          <div className="m-cart-items m-cart-success">
            <div className="m-success-icon"><Check size={48} strokeWidth={3} /></div>
            <h2>Order received!</h2>
            <p>We're preparing it now. You can track the status live.</p>
            
            <div className="m-success-ticket">
              <div><span>Order</span><strong>#{lastOrder.id}</strong></div>
              <div><span>Total</span><strong>R {lastOrder.total.toFixed(2)}</strong></div>
              <div><span>Pickup</span><strong>{lastOrder.customer?.pickupTime}</strong></div>
            </div>

            <button className="m-cart-primary-btn" onClick={handleTrackOrder} style={{ marginTop: 24, marginBottom: 12 }}>
              Track Order
            </button>
            <button className="m-cart-secondary-btn" onClick={onClose}>
              Back to menu
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}