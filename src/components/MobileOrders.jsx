import { useEffect, useState } from 'react';
import { supabase, getDeviceId } from '../lib/supabase';
import { ChevronRight, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '../hooks/useHaptics';
import ItemImage from './ItemImage';

export default function MobileOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const haptics = useHaptics();

  useEffect(() => {
    (async () => {
      try {
        // Direct Supabase fetch to avoid service import conflicts
        const deviceId = getDeviceId();
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('device_id', deviceId) // Only fetch orders from this device
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
    return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ck-ink-soft)' }}>Loading orders...</div>;
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

      {orders.map(order => (
        <div 
          key={order.id} 
          onClick={() => handleTrack(order.id)}
          style={{ 
            background: 'white', 
            borderRadius: '20px', 
            border: '1px solid var(--ck-border)', 
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            cursor: 'pointer'
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--ck-border)' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ck-brand-deep)' }}>#{order.order_number || order.id.substring(0,6)}</div>
              <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', marginTop: '2px' }}>
                {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ background: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status), padding: '6px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
              {order.status}
            </div>
          </div>

          {/* Items Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '-8px' }}>
              {(order.items || []).slice(0, 3).map((item, idx) => (
                <div key={idx} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', overflow: 'hidden', background: 'var(--ck-cream)', marginLeft: idx > 0 ? '-12px' : '0' }}>
                  <ItemImage src={item.image} alt={item.name} />
                </div>
              ))}
              {(order.items || []).length > 3 && (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', background: 'var(--ck-brand-deep)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, marginLeft: '-12px' }}>
                  +{order.items.length - 3}
                </div>
              )}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', marginLeft: '4px' }}>
              {(order.items || []).reduce((s, i) => s + i.qty, 0)} items
            </div>
          </div>

          {/* Footer Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '20px', fontWeight: 800, color: 'var(--ck-ink)' }}>
              R {Number(order.total).toFixed(2)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ck-brand-deep)', fontWeight: 700, fontSize: '13px' }}>
              Track order <ChevronRight size={16} />
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}