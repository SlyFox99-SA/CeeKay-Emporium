import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CheckCircle2, Package, ChefHat, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { playSuccess } from '../lib/chime';
import { cancelOrder } from '../services/orderService';
import CancelConfirmModal from '../components/mobile/order-status/CancelConfirmModal';
import { useSilentPolling } from '../hooks/useSilentPolling';
import LiquidTimer from '../components/LiquidTimer';
import { QRCodeSVG } from 'qrcode.react';

const STEPS = [
  { id: 'placed', label: 'Placed', desc: 'We got your order', icon: Package },
  { id: 'preparing', label: 'Preparing', desc: 'On the flat-top', icon: ChefHat },
  { id: 'ready', label: 'Ready', desc: 'Come grab it', icon: Clock },
  { id: 'completed', label: 'Collected', desc: 'Enjoy!', icon: CheckCircle2 },
];

const FALLBACK_IMG = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function MobileOrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let subscription;

    const fetchOrder = async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (!error && data) setOrder(data);
      setLoading(false);
    };

    fetchOrder();

    subscription = supabase
      .channel(`order-status-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder(payload.new);
          if (payload.new.status === 'ready') playSuccess();
        }
      )
      .subscribe();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      setOrder({ ...order, status: 'cancelled' });
      setShowConfirm(false);
    } catch (err) {
      alert(err.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ck-ink-soft)' }}>Loading order...</div>;
  }

  if (!order) {
    return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ck-achaar-red)' }}>Order not found.</div>;
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === (order.status === 'pending' ? 'placed' : order.status));
  const items = Array.isArray(order.items) ? order.items : [];
  const canCancel = order.status === 'pending' || order.status === 'placed';
  
  // Fallback for older orders missing prep_started_at
  const prepTime = order.prep_started_at || (order.status === 'preparing' ? order.created_at : null);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--ck-cream)', overflow: 'hidden' }}>
      
      {/* Fixed Top Bar */}
      <motion.header 
        initial={{ y: -50 }} animate={{ y: 0 }}
        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'white', borderBottom: '1px solid var(--ck-border)', zIndex: 10 }}
      >
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} color="var(--ck-ink)" />
        </button>
        <div style={{ marginLeft: '8px', fontWeight: 800, fontSize: '16px', color: 'var(--ck-ink)' }}>
          Order #{order.order_number || order.id.substring(0,6)}
        </div>
      </motion.header>

      {/* Scrollable Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Tracking Timeline Card */}
          <motion.div variants={itemVariants} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', margin: 0, color: 'var(--ck-ink)' }}>Tracking</h2>
            </div>
            
            {order.status === 'cancelled' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'var(--ck-achaar-red)' }}>
                 <X size={48} strokeWidth={2} style={{ marginBottom: '16px' }} />
                 <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Order Cancelled</h3>
                 <p style={{ margin: '4px 0 0', fontSize: '14px' }}>This order will not be prepared.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const Icon = step.icon;
                  return (
                    <div key={step.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                      {/* Animated Connecting Line */}
                      {idx !== STEPS.length - 1 && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: '100%' }}
                          transition={{ duration: 0.8, delay: idx * 0.2 }}
                          style={{ position: 'absolute', left: '19px', top: '40px', width: '2px', background: isCompleted ? 'var(--ck-brand-deep)' : 'var(--ck-border)', zIndex: 0 }} 
                        />
                      )}
                      
                      {/* Animated Icon Circle */}
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: idx * 0.1 }}
                        style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1,
                          background: isCurrent ? 'var(--ck-brand-deep)' : (isCompleted ? 'var(--ck-brand-light, #e0f2fe)' : 'var(--ck-cream)'),
                          color: isCurrent ? 'white' : (isCompleted ? 'var(--ck-brand-deep)' : 'var(--ck-ink-soft)'),
                          boxShadow: isCurrent ? '0 0 0 4px rgba(15, 46, 74, 0.1)' : 'none'
                        }}
                      >
                        {isCurrent ? (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          >
                            <Icon size={18} />
                          </motion.div>
                        ) : (
                          <Icon size={18} />
                        )}
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                        style={{ display: 'flex', flexDirection: 'column', paddingTop: '4px' }}
                      >
                        <span style={{ fontWeight: isCurrent ? 800 : 700, fontSize: '16px', color: isCompleted ? 'var(--ck-ink)' : 'var(--ck-ink-soft)' }}>{step.label}</span>
                        <span style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', marginTop: '2px' }}>{step.desc}</span>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Liquid Timer Card (Only shows when preparing) */}
          {order.status === 'preparing' && prepTime && (
            <motion.div variants={itemVariants} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LiquidTimer prepStartedAt={prepTime} totalMinutes={12} />
            </motion.div>
          )}

          {/* QR Code Card */}
          <motion.div variants={itemVariants} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: 'var(--ck-ink)' }}>Your Collection Ticket</h3>
            
            <motion.div 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ padding: '16px', background: 'var(--ck-cream)', borderRadius: '16px', border: '1px solid var(--ck-border)' }}
            >
              <QRCodeSVG 
                value={order.order_number || order.id} 
                size={180} 
                bgColor="#F9F6F0" 
                fgColor="#0F2E4A" 
                level="H"
              />
            </motion.div>
            
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--ck-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Order Number</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--ck-brand-deep)', letterSpacing: '0.05em' }}>
                #{order.order_number || order.id.substring(0,6).toUpperCase()}
              </div>
            </div>
          </motion.div>

          {/* Order Details Card */}
          <motion.div variants={itemVariants} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid var(--ck-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: 'var(--ck-ink)' }}>Pickup Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--ck-ink-soft)' }}>
                <Clock size={16} /> {order.customer?.pickupTime || 'As soon as possible'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--ck-ink-soft)' }}>
                <MapPin size={16} /> Benoni Branch
              </div>
            </div>

            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: 'var(--ck-ink)', borderTop: '1px solid var(--ck-border)', paddingTop: '24px' }}>Your Order</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
              {items.map((item, idx) => {
                const basePrice = Number(item.base_price) || Number(item.price) || 0;
                const modsTotal = (item.mods || []).reduce((s, m) => s + (Number(m.price) || 0), 0);
                const qty = Number(item.qty) || 1;
                const itemTotal = (basePrice + modsTotal) * qty;

                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}
                    key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                  >
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: 'var(--ck-cream)', flexShrink: 0 }}>
                      <img src={item.image || FALLBACK_IMG} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ck-ink)' }}>{qty}x {item.name}</div>
                      {item.mods && item.mods.length > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--ck-brand-deep)', fontWeight: 600, marginTop: '2px' }}>{item.mods.map(m => m.name).join(', ')}</div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>R {itemTotal.toFixed(2)}</div>
                  </motion.div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid var(--ck-border)' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ck-ink)' }}>Total</span>
              <span style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', fontWeight: 800, color: 'var(--ck-ink)' }}>R {Number(order.total || 0).toFixed(2)}</span>
            </div>
          </motion.div>

          {/* Cancel Button */}
          {canCancel && (
            <motion.button 
              variants={itemVariants}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowConfirm(true)} 
              style={{ width: '100%', padding: '16px', background: 'transparent', color: 'var(--ck-achaar-red)', border: '1px solid var(--ck-achaar-red)', borderRadius: '99px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', marginBottom: '40px' }}
            >
              Cancel Order
            </motion.button>
          )}

        </motion.div>
      </div>

      {/* Premium Confirmation Modal */}
      <CancelConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={handleCancel} 
        isCancelling={cancelling} 
      />
    </div>
  );
}