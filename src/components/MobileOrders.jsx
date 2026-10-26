 
import { useEffect, useState } from 'react';
import { supabase, getDeviceId } from '../lib/supabase';
import { ChevronRight, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

const FALLBACK_IMG = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop";

// Perfectly sized skeleton card
const OrderSkeleton = () => (
  <motion.div 
    animate={{ opacity: [0.4, 0.8, 0.4] }} 
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid var(--ck-border)', marginBottom: '16px', height: '188px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ width: '80px', height: '20px', background: 'var(--ck-cream)', borderRadius: '4px' }} />
      <div style={{ width: '60px', height: '24px', background: 'var(--ck-cream)', borderRadius: '12px' }} />
    </div>
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      <div style={{ width: '40px', height: '40px', background: 'var(--ck-cream)', borderRadius: '50%' }} />
      <div style={{ width: '40px', height: '40px', background: 'var(--ck-cream)', borderRadius: '50%', marginLeft: '-12px' }} />
      <div style={{ width: '40px', height: '40px', background: 'var(--ck-cream)', borderRadius: '50%', marginLeft: '-12px' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
      <div style={{ width: '80px', height: '24px', background: 'var(--ck-cream)', borderRadius: '4px' }} />
      <div style={{ width: '80px', height: '24px', background: 'var(--ck-cream)', borderRadius: '4px' }} />
    </div>
  </motion.div>
);

export default function MobileOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const haptics = useHaptics();

  useEffect(() => {
    (async () => {
      try {
        const deviceId = getDeviceId();
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleTrack = (id) => {
    haptics.light();
    navigate(`/order/${id}`);
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return 'var(--ck-green)';
    if (status === 'cancelled') return 'var(--ck-achaar-red)';
    if (status === 'ready') return 'var(--ck-green)';
    if (status === 'preparing') return 'var(--ck-warm)';
    return 'var(--ck-brand-deep)';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 20px' }}>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: '0 0 24px', color: 'var(--ck-ink)' }}>Your Orders</h1>
        <OrderSkeleton />
        <OrderSkeleton />
        <OrderSkeleton />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', padding: '20px', color: 'var(--ck-ink-soft)' }}>
        <ReceiptText size={64} strokeWidth={1} color="var(--ck-border-strong)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', color: 'var(--ck-ink)', marginBottom: '8px' }}>No orders yet</h2>
        <p>When you place an order, it will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: '0 0 8px', color: 'var(--ck-ink)' }}>Your Orders</h1>

      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
        {orders.map((order) => {
          const displayId = order.order_number || order.id.split('-')[0].toUpperCase();
          const total = Number(order.total) || 0;
          const items = Array.isArray(order.items) ? order.items : [];
          
          return (
            <motion.div 
              key={order.id} 
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } } }}
              onClick={() => handleTrack(order.id)}
              style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--ck-border)', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', cursor: 'pointer', marginBottom: '16px' }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--ck-border)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-brand-deep)' }}>#{displayId}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '2px' }}>
                    {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ background: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status), padding: '6px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                  {order.status}
                </div>
              </div>

              {/* Items Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  {items.slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden', background: 'var(--ck-cream)', marginLeft: idx > 0 ? '-12px' : '0', zIndex: 10 - idx, position: 'relative' }}>
                      <img src={item.image || FALLBACK_IMG} alt="" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', background: 'var(--ck-brand-deep)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, marginLeft: '-12px', zIndex: 0 }}>
                      +{items.length - 3}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', marginLeft: '4px' }}>
                  {items.reduce((s, i) => s + i.qty, 0)} items
                </div>
              </div>

              {/* Footer Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '20px', fontWeight: 800, color: 'var(--ck-ink)' }}>
                  R {total.toFixed(2)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ck-brand-deep)', fontWeight: 700, fontSize: '13px' }}>
                  Track order <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
