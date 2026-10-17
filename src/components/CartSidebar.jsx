import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft, User, Phone, Clock, Check, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { usePrefs } from '../context/PreferencesContext';
import { createOrder } from '../services/orderService';
import { burstConfetti } from '../lib/confetti';
import { playSuccess, playError } from '../lib/chime';
import ItemImage from './ItemImage';
import { recordOrder, saveProfile } from '../services/customerService';

const CUSTOMER_KEY = 'ceekay-customer';

const PICKUP_OPTIONS = [
  'As soon as possible',
  'In 15 minutes',
  'In 30 minutes',
  'In 1 hour',
  'I will specify on WhatsApp',
];

export default function CartSidebar({ open, onClose, onToast, onToastAction }) {
  const { cart, changeQty, removeItem, restoreLine, clearCart, total, count, lineKey } = useCart();
  const { store } = useStore();
  const { prefs } = usePrefs();

  const [step, setStep] = useState('cart');
  const [note, setNote] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) ||
        { name: '', phone: '', pickupTime: PICKUP_OPTIONS[0] };
    } catch {
      return { name: '', phone: '', pickupTime: PICKUP_OPTIONS[0] };
    }
  });

  useEffect(() => {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  }, [customer]);

  useEffect(() => {
    if (!open) setStep('cart');
  }, [open]);

  const updateCustomer = (field, value) =>
    setCustomer(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!customer.name.trim()) { if (prefs.sound) playError(); onToast('Please enter your name'); return false; }
    if (!customer.phone.trim()) { if (prefs.sound) playError(); onToast('Please enter your phone number'); return false; }
    return true;
  };

  const buildText = (orderId) => {
    const lines = [`🌟 ${store?.name ?? 'CeeKay Emporium'} — ${store?.branch ?? ''}`, ''];
    if (orderId) lines.push(`Order #${orderId}`, '');
    lines.push(`👤 ${customer.name}`);
    lines.push(`📞 ${customer.phone}`);
    lines.push(`⏰ ${customer.pickupTime}`, '');
    cart.forEach(i => {
      lines.push(`${i.name} x${i.qty} — R${(i.price * i.qty).toFixed(2)}`);
      if (i.removedIngredients?.length) lines.push(`   (no ${i.removedIngredients.join(', ')})`);
      if (i.itemNote) lines.push(`   note: ${i.itemNote}`);
    });
    lines.push('', `💰 Total: R${total.toFixed(2)}`);
    if (note.trim()) lines.push('', `📝 Notes: ${note.trim()}`);
    return lines.join('\n');
  };

  const finishOrder = (order) => {
    setLastOrder(order);
    setStep('success');
    if (prefs.sound) playSuccess();
    if (prefs.confetti) burstConfetti();
    clearCart();
    setNote('');
  };

  const orderWhatsApp = async () => {
    if (!store) return onToast('Please choose a store first');
    if (!cart.length) return onToast('Add something to your order first!');
    if (!validate()) return;
    const order = await createOrder({ store, cart, customer, note, channel: 'whatsapp', total });
    recordOrder(order);
    saveProfile({ name: customer.name, phone: customer.phone });
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(buildText(order.id))}`, '_blank');
    finishOrder(order);
  };

  const orderEmail = async () => {
    if (!store) return onToast('Please choose a store first');
    if (!cart.length) return onToast('Add something to your order first!');
    if (!validate()) return;
    const order = await createOrder({ store, cart, customer, note, channel: 'email', total });
    recordOrder(order);
    saveProfile({ name: customer.name, phone: customer.phone });
    const body = buildText(order.id);
    window.location.href = `mailto:${store.email}?subject=${encodeURIComponent(`New Order ${order.id} — ${store.branch}`)}&body=${encodeURIComponent(body)}`;
    finishOrder(order);
  };

  const handleRemoveWithUndo = (key) => {
    const idx = cart.findIndex(i => lineKey(i) === key);
    if (idx < 0) return;
    const line = { ...cart[idx] };
    removeItem(key);
    if (onToastAction) {
      onToastAction(`${line.name} removed`, 'Undo', () => {
        restoreLine(line, idx);
      });
    } else {
      onToast(`${line.name} removed`);
    }
  };

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`cart-side ${open ? 'open' : ''}`}>
        <div className="cart-head">
          <h3>
            {step === 'cart' && <>Your Order {count > 0 && <span>({count})</span>}</>}
            {step === 'details' && <>Checkout</>}
            {step === 'success' && <>Order placed</>}
          </h3>
          <button className="cart-close" onClick={onClose} aria-label="Close cart">✕</button>
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
                  <div className="cart-empty-emoji">🛒</div>
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
                        <button className="qty-btn" onClick={() => changeQty(key, -1)}>−</button>
                        <span className="qty-val">{item.qty}</span>
                        <button className="qty-btn" onClick={() => changeQty(key, 1)}>+</button>
                      </div>
                    </div>
                    <div className="c-line-total">R {(item.price * item.qty).toFixed(2)}</div>
                    <button className="c-remove" onClick={() => handleRemoveWithUndo(key)} aria-label="Remove">✕</button>
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
                <ArrowLeft size={14} /> Back to cart
              </button>

              <div className="details-intro">
                <h4>Almost done.</h4>
                <p>We need a name and number so we can let you know when it's ready.</p>
              </div>

              <label className="field">
                <span className="field-label"><User size={12} /> Your name</span>
                <input
                  type="text"
                  placeholder="Bongani"
                  value={customer.name}
                  onChange={e => updateCustomer('name', e.target.value)}
                  autoComplete="name"
                />
              </label>

              <label className="field">
                <span className="field-label"><Phone size={12} /> Phone number</span>
                <input
                  type="tel"
                  placeholder="082 123 4567"
                  value={customer.phone}
                  onChange={e => updateCustomer('phone', e.target.value)}
                  autoComplete="tel"
                />
              </label>

              <label className="field">
                <span className="field-label"><Clock size={12} /> When do you want it?</span>
                <select
                  value={customer.pickupTime}
                  onChange={e => updateCustomer('pickupTime', e.target.value)}
                >
                  {PICKUP_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">Notes (optional)</span>
                <textarea
                  placeholder="e.g. extra achaar, no cheese"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </label>
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
              <button className="order-btn whatsapp" onClick={orderWhatsApp}>
                Order on WhatsApp
              </button>
              <button className="order-btn email" onClick={orderEmail}>
                Order via Email
              </button>
            </div>
          </>
        )}

        {step === 'success' && lastOrder && (
          <div className="order-success">
            <div className="success-badge"><Check size={44} strokeWidth={3} /></div>
            <h2 className="success-title">Order placed!</h2>
            <p className="success-sub">Send the WhatsApp message and we'll have it ready.</p>

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

            <div className="success-items">
              {lastOrder.items.map((it, i) => (
                <div key={i} className="success-item">
                  <span className="success-item-thumb">
                    <ItemImage src={it.image} alt={it.name} />
                  </span>
                  <span className="success-item-name">{it.name}</span>
                  <span className="success-item-qty">× {it.qty}</span>
                </div>
              ))}
            </div>

            <div className="success-actions">
              <button className="success-btn-primary" onClick={onClose}>
                <Package size={15} /> Done
              </button>
            </div>

            <Link
              to={`/order/${lastOrder.id}`}
              className="success-track-link"
              onClick={onClose}
            >
              Track this order →
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
