import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Check, ShoppingBag, X, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import { usePrefs } from '../../context/PreferencesContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/orderService';
import { getDeviceId } from '../../lib/supabase';
import { playSuccess } from '../../lib/chime';
import { burstConfetti } from '../../lib/confetti';
import { useHaptics } from '../../hooks/useHaptics';
import ItemImage from '../ItemImage';
import CheckoutForm from './cart/CheckoutForm';
import MobileItemModal from './MobileItemModal';

const FALLBACK_IMG = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop";

export default function MobileCartSidebar({ open, onClose, onToast = () => {} }) {
  const haptics = useHaptics();
  const dragControls = useDragControls();
  
  const [step, setStep] = useState('cart');
  const [isPlacing, setIsPlacing] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [editingLine, setEditingLine] = useState(null);

  const { cart, updateItem, changeQty, removeItem, clearCart, total, lineKey } = useCart();
  const { store } = useStore();
  const { prefs } = usePrefs();
  const { user } = useAuth();

  useEffect(() => {
    if (!open) {
      setTimeout(() => setStep('cart'), 300);
      setEditingLine(null);
    }
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
          pickup_time: 'As soon as possible',
          store_id: store.id,
          user_id: user?.id,
          device_id: getDeviceId() || 'guest'
        }, 
        items: cart.map(item => ({ 
          id: item.id, 
          quantity: item.qty,
          modifier_ids: (item.modifiers || []).map(m => m.id)
        }))
      });

      setStep('success');
      if (prefs.sound) playSuccess();
      if (prefs.confetti) burstConfetti();
      haptics.success();
      clearCart();
    } catch (err) {
      haptics.error();
      onToast(err.message || 'Failed to place order.');
    } finally {
      setIsPlacing(false);
    }
  };

  const handleEditSave = (item, options) => {
    updateItem(editingLine.lineKey, item, options);
    setEditingLine(null);
    haptics.success();
  };

  return (
    <>
      <div className={`m-cart-overlay ${open ? 'open' : ''}`} onClick={onClose}/>
      
      <motion.div 
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--ck-cream)', borderRadius: '24px 24px 0 0', zIndex: 9999, height: '90dvh', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}
        initial={{ y: "100%" }} 
        animate={{ y: open ? 0 : "100%" }} 
        transition={{ type: "spring", damping: 22, stiffness: 250, bounce: 0.2 }}
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(e, info) => { if (info.offset.y > 100 || info.velocity.y > 500) onClose(); }}
      >
        <div 
          style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '28px 20px 16px', borderBottom: '1px solid var(--ck-border)', flexShrink: 0, background: 'var(--ck-cream)', borderRadius: '24px 24px 0 0', cursor: 'grab' }}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '48px', height: '6px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }} />
          
          <h2 style={{ margin: 0, fontFamily: 'var(--ck-font-serif)', fontSize: '20px', color: 'var(--ck-ink)' }}>
            {step === 'cart' ? 'Your Order' : step === 'details' ? 'Checkout': 'Success'}
          </h2>
          
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--ck-ink-soft)', position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-30%)' }}>
            <X size={20} />
          </button>
        </div>

        {step === 'cart' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', minHeight: 0 }}>
              {cart.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--ck-ink-soft)', gap: '16px', textAlign: 'center' }}>
                  <ShoppingBag size={48} /><h3>Your cart is empty</h3>
                </div>
              ) : cart.map((item, idx) => {
                const key = lineKey(item) || item.id || item- + idx;
                const isSoldOut = item.available === false;
                return (
                  <div 
                    key={key} 
                    onClick={() => { haptics.light(); setEditingLine(item); }}
                    style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid var(--ck-border)', cursor: 'pointer' }}
                  >
                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--ck-cream)', opacity: isSoldOut ? 0.5 : 1 }}>
                      <img 
                        src={item.image || FALLBACK_IMG} 
                        alt={item.name} 
                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-ink)', lineHeight: 1.2, wordBreak: 'break-word', paddingRight: '8px' }}>
                          {item.name}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeItem(key); haptics.light(); }} style={{ background: 'transparent', border: 'none', padding: '0 0 0 8px', color: 'var(--ck-achaar-red)', cursor: 'pointer' }}><X size={16} /></button>
                      </div>
                      
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--ck-brand-deep)', fontWeight: 600, marginBottom: '4px' }}>
                          {item.modifiers.map(m => `${m.qty > 1 ? m.qty + 'x ' : ''}${m.name}`).join(', ')}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ck-cream)', borderRadius: '99px', padding: '2px' }}>
                          <button onClick={(e) => { e.stopPropagation(); changeQty(key, -1); haptics.light(); }} style={{ background: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Minus size={14} /></button>
                          <span style={{ fontWeight: 800, width: '24px', textAlign: 'center', fontSize: '14px' }}>{item.qty}</span>
                          <button onClick={(e) => { e.stopPropagation(); changeQty(key, 1); haptics.light(); }} style={{ background: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={14} /></button>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '16px' }}>R {(item.price * item.qty).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {cart.length > 0 && (
              <div style={{ padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', background: 'white', borderTop: '1px solid var(--ck-border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '18px', fontWeight: 800 }}>
                  <span>Total</span>
                  <span>R {total.toFixed(2)}</span>
                </div>
                <button onClick={() => { setStep('details'); haptics.medium(); }} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 46, 74, 0.2)' }}>
                  Continue to checkout
                </button>
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
              style={{ background: 'var(--ck-green)', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 20px rgba(76, 175, 80, 0.3)' }}
            >
              <Check size={40} strokeWidth={3} />
            </motion.div>
            <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '32px', margin: '0 0 8px' }}>Order received!</h2>
            <p style={{ color: 'var(--ck-ink-soft)', marginBottom: '32px', fontSize: '15px' }}>We're preparing it now. You can track the status live.</p>
            
            <div style={{ width: '100%', marginTop: 'auto', paddingTop: '20px' }}>
              <button 
                onClick={() => { window.dispatchEvent(new Event('order_placed')); onClose(); }} 
                style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 46, 74, 0.2)' }}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* The Edit Modal Overlay */}
      <AnimatePresence>
        {editingLine && (
          <MobileItemModal 
            item={editingLine} 
            onClose={() => setEditingLine(null)} 
            onConfirm={handleEditSave} 
          />
        )}
      </AnimatePresence>
    </>
  );
}