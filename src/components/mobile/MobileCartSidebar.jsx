import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { usePrefs } from '../../context/PreferencesContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/orderService';
import { playSuccess } from '../../lib/chime';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';
import { useHaptics } from '../../hooks/useHaptics';
import ItemImage from '../ItemImage';
import CheckoutForm from './cart/CheckoutForm';

const PICKUP_OPTIONS = ['As soon as possible', 'In 15 minutes', 'In 30 minutes', 'In 1 hour'];

export default function MobileCartSidebar({ open, onClose, onToast = () => {} }) {
  const swipeProps = useSwipeToDismiss(onClose);
  const haptics = useHaptics();
  
  const [step, setStep] = useState('cart');
  const [isPlacing, setIsPlacing] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', pickupTime: PICKUP_OPTIONS[0] });

  const { cart, changeQty, removeItem, clearCart, total, lineKey } = useCart();
  const { store } = useStore();
  const { prefs } = usePrefs();
  const { user } = useAuth();

  useEffect(() => {
    if (!open) setTimeout(() => setStep('cart'), 300);
  }, [open]);

  const hasSoldOut = cart.some(item => item.available === false);

  const handlePlaceOrder = async () => {
    if (!store || !cart.length || isPlacing) return;
    if (hasSoldOut) return onToast('Please remove sold out items.');
    if (!customer.name.trim()) return onToast('Please enter your name');
    if (customer.phone.trim().length < 9) return onToast('Please enter a valid phone number');
    
    setIsPlacing(true);
    try {
      await createOrder({ 
        order: {
          customer_name: customer.name.trim(),
          customer_phone: customer.phone.trim(),
          pickup_time: customer.pickupTime,
          store_id: store.id,
          user_id: user?.id
        }, 
        items: cart.map(item => ({ 
          id: item.id, 
          quantity: item.qty,
          modifier_ids: (item.modifiers || []).map(m => m.id)
        }))
      });

      setStep('success');
      if (prefs.sound) playSuccess();
      haptics.success();
      clearCart();
    } catch (err) {
      haptics.error();
      onToast(err.message || 'Failed to place order.');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <>
      <div className={`m-cart-overlay ${open ? 'open' : ''}`} onClick={onClose}/>
      
      <motion.div className="m-cart-sheet" initial={{ y: "100%" }} animate={{ y: open ? 0 : "100%" }} transition={{ type: "spring", damping: 28, stiffness: 350 }}>
        <div className="m-cart-header" {...swipeProps} style={{ touchAction: 'none' }}>
          <div className="m-sheet-handle" />
          <h2>{step === 'cart' ? 'Your Order' : step === 'details' ? 'Checkout': 'Success'}</h2>
          <button className="m-cart-close" onClick={onClose}><X size={20} /></button>
        </div>

        {step === 'cart' && (
          <>
            <div className="m-cart-items">
              {cart.length === 0 ? (
                <div className="m-cart-empty"><ShoppingBag size={48} /><h3>Your cart is empty</h3></div>
              ) : cart.map(item => {
                const key = lineKey(item);
                const isSoldOut = item.available === false;
                return (
                  <div key={key} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--ck-border)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, opacity: isSoldOut ? 0.5 : 1 }}>
                      <ItemImage src={item.image} alt={item.name} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-ink)', lineHeight: 1.2 }}>{item.name}</div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--ck-brand-deep)', marginTop: '4px', fontWeight: 600 }}>
                          {item.modifiers.map(m => `${m.qty > 1 ? m.qty + 'x ' : ''}${m.name}`).join(', ')}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ck-cream)', borderRadius: '99px', padding: '2px' }}>
                          <button onClick={() => { changeQty(key, -1); haptics.light(); }} style={{ background: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                          <span style={{ fontWeight: 800, width: '24px', textAlign: 'center', fontSize: '14px' }}>{item.qty}</span>
                          <button onClick={() => { changeQty(key, 1); haptics.light(); }} style={{ background: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '16px' }}>R {(item.price * item.qty).toFixed(2)}</div>
                      </div>
                    </div>
                    <button onClick={() => { removeItem(key); haptics.light(); }} style={{ background: 'transparent', border: 'none', padding: '4px', color: 'var(--ck-achaar-red)' }}><X size={18} /></button>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <div className="m-cart-footer">
                <div className="m-cart-totals"><span>Total</span><strong>R {total.toFixed(2)}</strong></div>
                <button className="m-cart-primary-btn" onClick={() => { setStep('details'); haptics.medium(); }}>Continue to checkout</button>
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <CheckoutForm 
            cart={cart} 
            total={total} 
            customer={customer} 
            setCustomer={setCustomer} 
            onBack={() => setStep('cart')} 
            onSubmit={handlePlaceOrder} 
            isPlacing={isPlacing} 
          />
        )}

        {step === 'success' && (
          <div className="m-cart-items m-cart-success" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ background: 'var(--ck-green)', color: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Check size={32} strokeWidth={3} /></div>
            <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: '0 0 8px' }}>Order received!</h2>
            <p style={{ color: 'var(--ck-ink-soft)', marginBottom: '32px' }}>We're preparing it now. You can track the status live.</p>
            <button className="m-cart-primary-btn" onClick={onClose}>Back to menu</button>
          </div>
        )}
      </motion.div>
    </>
  );
}