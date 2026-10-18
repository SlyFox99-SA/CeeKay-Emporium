import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, User, Phone, Clock, Check, ShoppingBag, X, Minus, Plus, Loader2, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { usePrefs } from '../../context/PreferencesContext';
import { createOrder } from '../../services/orderService';
import { recordOrder, saveProfile } from '../../services/customerService';
import { validatePromo } from '../../services/promoService';
import { burstConfetti } from '../../lib/confetti';
import { playSuccess, playError } from '../../lib/chime';
import ItemImage from '../ItemImage';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';
import { useHaptics } from '../../hooks/useHaptics';

const CUSTOMER_KEY = 'ceekay-customer';
const PICKUP_OPTIONS = ['As soon as possible', 'In 15 minutes', 'In 30 minutes', 'In 1 hour'];

export default function MobileCartSidebar({ open, onClose, onToast = () => {} }) {
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('cart');
  const [note, setNote] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  
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

  // Inventory Check
  const hasSoldOut = cart.some(item => item.is_available === false);

  const validate = () => {
    if (hasSoldOut) { if (prefs.sound) playError(); haptics.error(); onToast('Please remove sold out items from your cart.'); return false; }
    if (!customer.name.trim()) { if (prefs.sound) playError(); haptics.error();onToast('Please enter your name'); return false; }
    if (customer.phone.trim().length < 9) { if (prefs.sound) playError(); haptics.error(); onToast('Please enter a valid phone number'); return false; }
    return true;
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    const promo = await validatePromo(promoInput);
    if (promo) {
      setAppliedPromo(promo);
      haptics.success();
      onToast(`Promo applied: ${promo.discount_percent}% off!`);
    } else {
      setAppliedPromo(null);
      setPromoError('Invalid or expired code');
      haptics.error();
    }
  };

  const discountAmount = appliedPromo ? (total * (appliedPromo.discount_percent/ 100)) : 0;
  const finalTotal = total - discountAmount;

  const handlePlaceOrder = async () => {
    if (!store || !cart.length || !validate() || isPlacing) return;
    
    setIsPlacing(true);
    try {
      // Mapped to the new RPC structure
      if (!store || !store.id) {
        throw new Error('No store selected. Please select a store from the top menu.');
      }
      
      // Safety check: Ensure we aren't sending a legacy static string ID (like "benoni")
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(store.id);
      if (!isUUID) {
        throw new Error('Your selected store is outdated. Please close this menu, tap the store name at the top, and select a branch.');
      }

      // Safety check: Ensure the cart doesn't contain legacy static item IDs (like "1", "2")
      const hasLegacyItems = cart.some(item => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id));
      if (hasLegacyItems) {
        throw new Error('Your cart contains outdated items. Please clear your cart and add them again.');
      }

      const order = await createOrder({ 
        order: {
          customer_name: customer.name.trim(),
          customer_phone: customer.phone.trim(),
          order_type: 'collection',
          notes: note.trim(),
          payment_method: 'pay_on_collection',
          delivery_fee: 0,
          pickup_time: customer.pickupTime,
          store_id: store.id // Guaranteed to be a valid UUID now
        }, 
        // Ensure IDs are formatted properly and quantities are numbers
        items: cart.map(item => ({ 
          id: item.id, 
          quantity: Number(item.qty) 
        }))
      });

      recordOrder(order); 
      saveProfile({ name: customer.name, phone: customer.phone });
      
      setLastOrder({ ...order, total: finalTotal, customer }); // include UI details for success screen
      setStep('success');
      if (prefs.sound) playSuccess();
      if (prefs.confetti) burstConfetti();
      haptics.success();
      
      clearCart();
      setNote('');
      setAppliedPromo(null);
      setPromoInput('');
    } catch (err) {
      haptics.error();
      // Display the exact error from the database to the user via Toast
      onToast(err.message || 'Failed to place order. Please check your connection.');
      console.error('Order Error:', err);
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
      <div className={`m-cart-overlay ${open ? 'open' : ''}`} onClick={onClose}/>
      
      <motion.div 
        className="m-cart-sheet"
        initial={{ y: "100%" }}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
      >
        <div className="m-cart-header" {...swipeProps} style={{ touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div style={{ width: 24 }} /> {/* Spacer for centering */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="m-sheet-handle" style={{ marginBottom: '8px' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{step === 'cart' ? 'Your Order' : step === 'details' ? 'Checkout': 'Success'}</h2>
          </div>
          <button className="m-cart-close" onClick={onClose} style={{ background: 'none', border: 'none', padding: 0 }}>
            <ChevronDown size={24} color="var(--ck-ink-soft)" />
          </button>
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
                const isSoldOut = item.is_available === false;
                return (
                  <div key={key} className="m-cart-item" style={{ opacity: isSoldOut ? 0.6 : 1 }}>
                    <div className="m-cart-thumb"><ItemImage src={item.image} alt={item.name} /></div>
                    <div className="m-cart-item-info">
                      <div className="m-cart-item-name">
                        {item.name} {isSoldOut && <span style={{color: 'var(--ck-achaar-red)', fontSize: '10px', fontWeight: 800, marginLeft: 4}}>(SOLD OUT)</span>}
                      </div>
                      <div className="m-cart-item-price">R {item.price.toFixed(2)}</div>
                      <div className="m-cart-qty-row">
                        <button className="m-cart-qty-btn" onClick={() => { changeQty(key, -1); haptics.light(); }} disabled={isSoldOut}><Minus size={14} /></button>
                        <span className="m-cart-qty-val">{item.qty}</span>
                        <button className="m-cart-qty-btn" onClick={() => { changeQty(key, 1); haptics.light(); }} disabled={isSoldOut}><Plus size={14} /></button>
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
                <button 
                  className="m-cart-primary-btn" 
                  onClick={() => { setStep('details'); haptics.medium(); }}
                  disabled={hasSoldOut}
                  style={{ background: hasSoldOut ? 'var(--ck-border-strong)' : 'var(--ck-brand-deep)' }}
                >
                  {hasSoldOut ? 'Remove sold out items' : 'Continue to checkout'}
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

                <div className="m-form-group" style={{ marginTop: '8px' }}>
                  <label className="m-field">
                    <span className="m-label">Promo Code</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="e.g. KOTA10" 
                        value={promoInput} 
                        onChange={e => setPromoInput(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                      />
                      <button 
                        type="button"
                        onClick={handleApplyPromo}
                        style={{ background: 'var(--ck-charcoal)', color: 'white', border: 'none', borderRadius: '16px', padding: '0 20px', fontWeight: 800 }}
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && <span style={{ color: 'var(--ck-action)', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>{promoError}</span>}
                    {appliedPromo && <span style={{ color: 'var(--ck-green)', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>{appliedPromo.discount_percent}% Discount Applied!</span>}
                  </label>
                </div>

                <label className="m-field">
                  <span className="m-label">Notes</span>
                  <textarea placeholder="Extra achaar..." value={note} onChange={e => setNote(e.target.value)} />
                </label>
              </div>
            </div>
            <div className="m-cart-footer">
              
              <div className="m-cart-totals" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',fontSize: '14px' }}>
                  <span>Subtotal</span>
                  <span>R {total.toFixed(2)}</span>
                </div>
                {appliedPromo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--ck-green)', fontWeight: 700 }}>
                    <span>Discount ({appliedPromo.discount_percent}%)</span>
                    <span>-R {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between',alignItems: 'center', borderTop: '1px solid var(--ck-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ck-ink-soft)' }}>Total to pay</span>
                  <strong style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', color: 'var(--ck-ink)' }}>R {finalTotal.toFixed(2)}</strong>
                </div>
              </div>

              <button 
                className="m-cart-primary-btn" 
                onClick={handlePlaceOrder}
                disabled={isPlacing} 
                style={{ marginTop: '16px' }}
              >
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