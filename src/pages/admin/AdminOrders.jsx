import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, subscribeToOrders } from '../../services/orderService';
import { useHaptics } from '../../hooks/useHaptics';
import { Clock, CheckCircle } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const haptics = useHaptics();

  useEffect(() => {
    const unsubscribe = subscribeToOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id, status) => {
    haptics.success();
    await updateOrderStatus(id, status);
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const statusColors = {
    pending: 'var(--ck-warm)',
    preparing: 'var(--ck-brand-deep)',
    ready: 'var(--ck-green)',
    completed: 'var(--ck-ink-soft)',
    cancelled: 'var(--ck-achaar-red)'
  };

  return (
    <div style={{ padding: '24px 20px 0 20px' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Manage</div>
        <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: '0 0 16px', color: 'var(--ck-ink)' }}>Orders</h1>
        
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {['all', 'pending', 'preparing', 'ready', 'completed'].map(f => (
            <button 
              key={f} onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: '99px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                background: filter === f ? 'var(--ck-brand-deep)' : 'white',
                color: filter === f ? 'white' : 'var(--ck-ink-soft)',
                boxShadow: filter === f ? '0 4px 10px rgba(15, 46, 74, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)'
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.map(order => (
          <div key={order.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid var(--ck-border)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--ck-brand-deep)' }}>#{order.id}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ck-ink-soft)' }}>{order.customer?.name || 'Walk-in'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', background: `${statusColors[order.status]}15`, color: statusColors[order.status] }}>
                  {order.status}
                </span>
                <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '6px' }}>
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--ck-cream)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span><strong>{item.qty}x</strong> {item.name}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '18px' }}>R {Number(order.total).toFixed(2)}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {order.status === 'pending' && (
                  <button onClick={() => handleStatusChange(order.id, 'preparing')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    <Clock size={14} /> Start Prep
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button onClick={() => handleStatusChange(order.id, 'ready')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    <CheckCircle size={14} /> Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button onClick={() => handleStatusChange(order.id, 'completed')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--ck-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    <CheckCircle size={14} /> Collected
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ck-ink-soft)' }}>No orders found.</div>
        )}
      </div>
    </div>
  );
}