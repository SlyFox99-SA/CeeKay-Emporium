import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft, User, Phone, Clock, Check, Package, ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { usePrefs } from '../context/PreferencesContext';
import { createOrder } from '../services/orderService';
import { recordOrder, saveProfile } from '../services/customerService';
import { burstConfetti } from '../lib/confetti';
import { playSuccess, playError } from '../lib/chime';
import ItemImage from './ItemImage';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';

const CUSTOMER_KEY = 'ceekay-customer';
const PICKUP_OPTIONS = ['As soon as possible', 'In 15 minutes', 'In 30 minutes', 'In 1 hour'];

export default function CartSidebar({ open, onClose, onToast, onToastAction }) {
  const swipeProps = useSwipeToDismiss(onClose);
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
    if (!open) setStep('cart');
  }, [open]);

  const updateCustomer = (field, value) => setCustomer(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!customer.name.trim()) { if (prefs.sound) playError(); onToast('Please enter your name'); return false; }
    if (!customer.phone.trim()) { if (prefs.sound) playError(); onToast('Please enter your phone number'); return false; }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!store || !cart.length || !validate()) return;
    
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
      
      clearCart();
      setNote('');
    } catch (err) {
      onToast('Failed to place order.');
      console.error(err);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`cart-side ${open ? 'open' : ''}`}>
        
        <div className="cart-head" {...swipeProps} style={{ touchAction: 'none' }}>
          <h3>
            {step === 'cart' && <>Your Order {count > 0 && <span>({count})</span>}</>}
            {step === 'details' && <>Checkout</>}
            {step === 'success' && <>Order placed</>}
          </h3>
          <button className="cart-close" onClick={onClose} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        {store && step !== 'success' && (
          <div className="cart-store-banner">
            <MapPin size={13} strokeWidth={2.4} /> Ordering from <strong>{store.branch}</strong>
          </div>
        )}

        {step === 'cart' && (
          <>
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-emoji"><ShoppingBag size={44} strokeWidth={1.5} color="var(--ck-brand)" /></div>
                  <div className="cart-empty-title">Your cart is empty</div>
                  <div className="cart-empty-sub">Add a kota to get started.</div>
                </div>
              ) : cart.map(item => {
                const key = lineKey(item);
                return (
                  <div key={key} className="cart-item">
                    <span className="c-thumb">
                      <ItemImage src={item.image} alt={item.name} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="c-name">{item.name}</div>
                      {item.removedIngredients?.length > 0 && (
                        <div className="c-custom">No {item.removedIngredients.join(', ')}</div>
                      )}
                      {item.itemNote && <div className="c-custom">"{item.itemNote}"</div>}
                      <div className="c-unit-price">R {item.price.toFixed(2)} each</div>
                      
                      <div className="c-qty-row">
                        <button className="qty-btn" onClick={() => changeQty(key, -1)}><Minus size={14} /></button>
                        <span className="qty-val">{item.qty}</span>
                        <button className="qty-btn" onClick={() => changeQty(key, 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                    
                    <div className="c-line-total">R {(item.price * item.qty).toFixed(2)}</div>
                    <button className="c-remove" onClick={() => removeItem(key)} aria-label="Remove">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {cart.length > 0 && (
              <div className="cart-foot">
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>Subtotal ({count} item{count > 1 ? 's' : ''})</span>
                    <span>R {total.toFixed(2)}</span>
                  </div>
                  <div className="price-row price-row-total">
                    <span>Total</span>
                    <strong>R {total.toFixed(2)}</strong>
                  </div>
                  <div className="price-note">Pay on collection. No card needed.</div>
                </div>
                <button className="order-btn primary" onClick={() => setStep('details')}>
                  Continue to checkout
                </button>
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <>
            <div className="cart-items">
              <button className="cart-back" onClick={() => setStep('cart')}>
                <ArrowLeft size={16} /> Back to cart
              </button>

              <div className="details-intro">
                <h4>Almost done.</h4>
                <p>We need a name and number so we can let you know when it's ready.</p>
              </div>

              <div className="mobile-form-group">
                <label className="field">
                  <span className="field-label"><User size={12} /> Your name</span>
                  <input type="text" placeholder="Bongani" value={customer.name} onChange={e => updateCustomer('name', e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label"><Phone size={12} /> Phone number</span>
                  <input type="tel" placeholder="082 123 4567" value={customer.phone} onChange={e => updateCustomer('phone', e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label"><Clock size={12} /> When do you want it?</span>
                  <select value={customer.pickupTime} onChange={e => updateCustomer('pickupTime', e.target.value)}>
                    {PICKUP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Notes (optional)</span>
                  <textarea placeholder="e.g. extra achaar, no cheese" value={note} onChange={e => setNote(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="cart-foot">
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal ({count} item{count > 1 ? 's' : ''})</span>
                  <span>R {total.toFixed(2)}</span>
                </div>
                <div className="price-row price-row-total">
                  <span>Total to pay</span>
                  <strong>R {total.toFixed(2)}</strong>
                </div>
                <div className="price-note">Pay on collection. No card needed.</div>
              </div>
              <button className="order-btn primary" onClick={handlePlaceOrder} disabled={isPlacing}>
                {isPlacing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </>
        )}

        {step === 'success' && lastOrder && (
          <div className="order-success">
            <div className="success-badge"><Check size={44} strokeWidth={3} /></div>
            <h2 className="success-title">Order placed!</h2>
            <p className="success-sub">We've received your order and we're preparing it now.</p>

            <div className="success-ticket">
              <div className="ticket-row">
                <span className="ticket-label">Order</span>
                <span className="ticket-value">#{lastOrder.id}</span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">Name</span>
                <span className="ticket-value">{lastOrder.customer.name}</span>
              </div>
              <div className="ticket-row">
                <span className="ticket-label">Pickup</span>
                <span className="ticket-value">{lastOrder.customer.pickupTime}</span>
              </div>
              <div className="ticket-row ticket-row-total">
                <span className="ticket-label">Total</span>
                <span className="ticket-value">R {lastOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="success-actions">
              <button className="success-btn-primary" onClick={onClose}>
                <Package size={15} /> Done
              </button>
            </div>

            <Link to={`/order/${lastOrder.id}`} className="success-track-link" onClick={onClose}>
              Track this order →
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}