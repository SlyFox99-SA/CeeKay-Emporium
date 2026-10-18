import { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Play } from 'lucide-react';
import { updateOrderStatus, subscribeToOrders } from '../services/orderService';
import { useNewOrderAlerts } from '../hooks/useNewOrderAlerts';
import { useHaptics } from '../hooks/useHaptics';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const haptics = useHaptics();
  const alerts = useNewOrderAlerts() || {};

  useEffect(() => {
    const unsubscribe = subscribeToOrders(setOrders);
    return () => unsubscribe();
  }, []);

  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

  const handleStatusChange = async (id, newStatus) => {
    haptics.success();
    await updateOrderStatus(id, newStatus);
  };

  const columns = [
    { id: 'pending', label: 'New Orders', icon: Clock, color: 'var(--ck-brand-deep)' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, color: 'var(--ck-warm)' },
    { id: 'ready', label: 'Ready', icon: CheckCircle2, color: 'var(--ck-green)' },
  ];

  return (
    <div style={{ background: '#f4f5f7', minHeight: '100vh', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ChefHat size={32} color="var(--ck-brand-deep)" />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>Kitchen</h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--ck-ink-soft)' }}>Active Orders: {activeOrders.length}</p>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px', alignItems: 'flex-start' }}>
        {columns.map(col => {
          const colOrders = activeOrders.filter(o => o.status === col.id);
          return (
            <div key={col.id} style={{ minWidth: '300px', maxWidth: '350px', background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--ck-border)' }}>
                <col.icon size={20} color={col.color} />
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ck-ink)' }}>{col.label}</h2>
                <span style={{ marginLeft: 'auto', background: 'var(--ck-cream)', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, color: 'var(--ck-brand-deep)' }}>{colOrders.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {colOrders.map(order => (
                  <div key={order.id} style={{ background: 'var(--ck-cream)', border: '1px solid var(--ck-border)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--ck-brand-deep)' }}>#{order.id}</div>
                      <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>{order.customer?.name || 'Walk-in'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', background: 'white', padding: '12px', borderRadius: '8px' }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '15px', fontWeight: 600 }}>
                          <span style={{ color: 'var(--ck-brand-deep)', marginRight: '8px' }}>{item.qty}x</span> {item.name}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {order.status === 'pending' && (
                        <button onClick={() => handleStatusChange(order.id, 'preparing')} style={{ flex: 1, padding: '12px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                          <Play size={16} /> Start Prep
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => handleStatusChange(order.id, 'ready')} style={{ flex: 1, padding: '12px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                          <CheckCircle2 size={16} /> Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => handleStatusChange(order.id, 'completed')} style={{ flex: 1, padding: '12px', background: 'var(--ck-green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                          <CheckCircle2 size={16} /> Collected
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {colOrders.length === 0 && <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ck-ink-soft)', fontSize: '15px', fontWeight: 500 }}>No orders</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}