import { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrders, updateOrderStatus, subscribeToOrders } from '../../services/orderService';
import { useHaptics } from '../../hooks/useHaptics';



const SkeletonOrder = () => (
  <motion.div 
    animate={{ opacity: [0.5, 1, 0.5] }} 
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid var(--ck-border)', marginBottom: '16px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ width: '100px', height: '20px', background: 'var(--ck-cream)', borderRadius: '4px' }} />
      <div style={{ width: '60px', height: '24px', background: 'var(--ck-cream)', borderRadius: '12px' }} />
    </div>
    <div style={{ width: '100%', height: '60px', background: 'var(--ck-cream)', borderRadius: '8px', marginBottom: '16px' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ width: '80px', height: '24px', background: 'var(--ck-cream)', borderRadius: '4px' }} />
      <div style={{ width: '100px', height: '36px', background: 'var(--ck-cream)', borderRadius: '8px' }} />
    </div>
  </motion.div>
);

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const haptics = useHaptics();


  useEffect(() => {
    const unsubscribe = subscribeToOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id, status) => {
    haptics.success();
    await updateOrderStatus(id, status);
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const statusColors = {
    pending: 'var(--ck-warm)',
    placed: 'var(--ck-warm)',
    preparing: 'var(--ck-brand-deep)',
    ready: 'var(--ck-green)',
    completed: 'var(--ck-ink-soft)',
    cancelled: 'var(--ck-achaar-red)'
  };

  return (
    <div style={{ padding: '24px 20px', position: 'relative', minHeight: '100dvh' }}>
      <header style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Manage</div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Orders</h1>
        </div>
      </header>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {['all', 'pending', 'placed', 'preparing', 'ready', 'completed'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '99px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === f ? 'var(--ck-brand-deep)' : 'white',
              color: filter === f ? 'white' : 'var(--ck-ink-soft)',
              boxShadow: filter === f ? '0 4px 10px rgba(15, 46, 74, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div>
          <SkeletonOrder />
          <SkeletonOrder />
          <SkeletonOrder />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map(order => (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>#{order.orderNumber || order.id.substring(0,6)}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>{order.customer?.name || 'Walk-in'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', background: `${statusColors[order.status] || 'var(--ck-ink-soft)'}15`, color: statusColors[order.status] || 'var(--ck-ink-soft)' }}>
                    {order.status}
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '6px', fontWeight: 600 }}>
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--ck-cream)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 600 }}>
                    <span><strong>{item.qty}x</strong> {item.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '18px' }}>R {Number(order.total).toFixed(2)}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(order.status === 'pending' || order.status === 'placed') && (
                    <button onClick={() => handleStatusChange(order.id, 'preparing')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}>
                      <Clock size={14} /> Start Prep
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => handleStatusChange(order.id, 'ready')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}>
                      <CheckCircle size={14} /> Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => handleStatusChange(order.id, 'completed')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--ck-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}>
                      <CheckCircle size={14} /> Collected
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {filteredOrders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ck-ink-soft)' }}>No orders found.</div>
          )}
        </div>
      )}

      

      
    </div>
  );
}