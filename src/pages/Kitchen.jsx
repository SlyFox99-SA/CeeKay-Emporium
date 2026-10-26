 
import { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Play, Volume2, VolumeX, ArrowLeft, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateOrderStatus, subscribeToOrders } from '../services/orderService';
import { useHaptics } from '../hooks/useHaptics';
import { playChime, primeAudio } from '../lib/chime';
import LiquidTimer from '../components/LiquidTimer';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeCol, setActiveCol] = useState('pending');
  const [isShiftStarted, setIsShiftStarted] = useState(false);
  
  const haptics = useHaptics();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isShiftStarted) return;

    const unsubscribe = subscribeToOrders((data) => {
      setOrders(data);
      // Only play chime if new order count increases
      if (soundEnabled && data.length > orders.length) {
        playChime();
      }
    });
    return () => unsubscribe();
  }, [isShiftStarted, soundEnabled, orders.length]);

  const handleStartShift = () => {
    primeAudio(); // Force unlock the AudioContext
    setIsShiftStarted(true);
    haptics.success();
  };

  const activeOrders = orders.filter(o => ['pending', 'placed', 'preparing', 'ready'].includes(o.status));

  const handleStatusChange = async (id, newStatus) => {
    haptics.success();
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    await updateOrderStatus(id, newStatus);
  };

  const columns = [
    { id: 'pending', label: 'New Orders', icon: Clock, color: 'var(--ck-brand-deep)' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, color: 'var(--ck-warm)' },
    { id: 'ready', label: 'Ready', icon: CheckCircle2, color: 'var(--ck-green)' },
  ];

  const currentColOrders = activeOrders.filter(o => o.status === activeCol || (o.status === 'placed' && activeCol === 'pending'));

  // PREVENT RENDERING UNTIL SHIFT IS STARTED
  if (!isShiftStarted) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7', padding: '20px', textAlign: 'center' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ background: 'var(--ck-cream)', padding: '24px', borderRadius: '50%' }}>
              <ChefHat size={48} color="var(--ck-brand-deep)" />
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: '0 0 8px', color: 'var(--ck-ink)' }}>Kitchen Terminal</h1>
          <p style={{ color: 'var(--ck-ink-soft)', fontSize: '15px', marginBottom: '32px' }}>Tap below to start your shift and enable order sounds.</p>
          
          <button 
            onClick={handleStartShift} 
            style={{ width: '100%', padding: '18px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            <LockKeyhole size={20} /> Start Shift
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f4f5f7', overflow: 'hidden' }}>
      <header style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'white', borderBottom: '1px solid var(--ck-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }}>
            <ArrowLeft size={20} color="var(--ck-ink)" />
          </button>
          <ChefHat size={24} color="var(--ck-brand-deep)" />
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--ck-font-serif)', color: 'var(--ck-ink)' }}>Kitchen</h1>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ck-ink-soft)' }}>{activeOrders.length} Active</p>
          </div>
        </div>
        
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{ background: 'var(--ck-cream)', border: '1px solid var(--ck-border)', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {soundEnabled ? <Volume2 size={18} color="var(--ck-brand-deep)" /> : <VolumeX size={18} color="var(--ck-ink-soft)" />}
        </button>
      </header>

      <div style={{ flexShrink: 0, display: 'flex', background: 'white', borderBottom: '1px solid var(--ck-border)' }}>
        {columns.map(col => {
          const count = activeOrders.filter(o => o.status === col.id || (o.status === 'placed' && col.id === 'pending')).length;
          const isActive = activeCol === col.id;
          return (
            <button
              key={col.id}
              onClick={() => { setActiveCol(col.id); haptics.light(); }}
              style={{
                flex: 1, padding: '16px 8px', border: 'none', background: 'transparent', cursor: 'pointer',
                borderBottom: isActive ? `3px solid ${col.color}` : '3px solid transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
              }}
            >
              <col.icon size={18} color={isActive ? col.color : 'var(--ck-ink-soft)'} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: isActive ? 'var(--ck-ink)' : 'var(--ck-ink-soft)' }}>{col.label}</span>
              {count > 0 && (
                <span style={{ background: isActive ? col.color : 'var(--ck-cream)', color: isActive ? 'white' : 'var(--ck-ink-soft)', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 800 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '100px' }}>
        {currentColOrders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ck-ink-soft)' }}>
            <CheckCircle2 size={64} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.2 }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>No orders here</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentColOrders.map(order => (
              <div key={order.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--ck-brand-deep)' }}>#{order.orderNumber || order.id.substring(0,6)}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    {['preparing', 'ready'].includes(order.status) && (
                      <LiquidTimer prepStartedAt={order.prepStartedAt} totalMinutes={12} />
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>{order.customer?.name || 'Walk-in'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', background: 'var(--ck-cream)', padding: '12px', borderRadius: '8px' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '15px', fontWeight: 600 }}>
                      <span style={{ color: 'var(--ck-brand-deep)', marginRight: '8px' }}>{item.qty}x</span> {item.name}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(order.status === 'pending' || order.status === 'placed') && (
                    <button onClick={() => handleStatusChange(order.id, 'preparing')} style={{ flex: 1, padding: '14px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                      <Play size={18} /> Start Prep
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button onClick={() => handleStatusChange(order.id, 'ready')} style={{ flex: 1, padding: '14px', background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                      <CheckCircle2 size={18} /> Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => handleStatusChange(order.id, 'completed')} style={{ flex: 1, padding: '14px', background: 'var(--ck-green)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                      <CheckCircle2 size={18} /> Collected
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
