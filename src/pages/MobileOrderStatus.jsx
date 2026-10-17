import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ChefHat, CheckCircle2, Clock, Phone, Bell } from 'lucide-react';
import { getHistory } from '../services/customerService';
import { getOrders, subscribeToOrders } from '../services/orderService';
import { playSuccess } from '../lib/chime';
import ItemImage from '../components/ItemImage';

const STEPS = [
  { key: 'placed',    label: 'Placed',    sub: 'We got your order', icon: Package },
  { key: 'preparing', label: 'Preparing', sub: 'On the flat-top', icon: ChefHat },
  { key: 'ready',     label: 'Ready',     sub: 'Come grab it', icon: CheckCircle2 },
  { key: 'completed', label: 'Collected', sub: 'Enjoy!', icon: CheckCircle2 },
];

export default function MobileOrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  
  const prevStatus = useRef(null);

  useEffect(() => {
    // Ask for notification permission if not granted yet
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotifEnabled(p === 'granted'));
    } else if (Notification.permission === 'granted') {
      setNotifEnabled(true);
    }

    const load = async () => {
      const live = (await getOrders()).find(o => o.id === id);
      if (live) setOrder(live);
      else {
        const hist = (await getHistory()).find(h => h.id === id);
        if (hist) setOrder(hist);
      }
      setLoading(false);
    };

    load();
    const unsub = subscribeToOrders(load);
    const i = setInterval(load, 5000);
    return () => { unsub(); clearInterval(i); };
  }, [id]);

  // Detect status change to "Ready" and fire notification
  useEffect(() => {
    if (!order) return;

    if (prevStatus.current && prevStatus.current !== 'ready' && order.status === 'ready') {
      // Fire native notification
      if (notifEnabled && typeof Notification !== 'undefined') {
        new Notification(`Order #${order.id} is Ready!`, {
          body: `Your food is ready for pickup at ${order.storeBranch}.`,
          icon: '/icon.svg'
        });
      }
      // Play chime and vibrate
      playSuccess();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    
    prevStatus.current = order.status;
  }, [order?.status, notifEnabled]);

  if (loading) return <div className="mobile-app-shell"><div className="mobile-loading">Tracking...</div></div>;
  if (!order) return <div className="mobile-app-shell"><div className="mobile-loading">Order not found.</div></div>;

  const currentIdx = STEPS.findIndex(s => s.key === order.status);
  const isReady = order.status === 'ready' || order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="mobile-app-shell">
      <header className="mobile-topbar" style={{ borderBottom: 'none' }}>
        <button className="mobile-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div className="mobile-brand" style={{ fontSize: 16 }}>Order #{order.id}</div>
        <div style={{ width: 24 }} />
      </header>

      <main className="mobile-scroll-area">
        {notifEnabled && (
          <div className="notif-banner">
            <Bell size={14} /> You'll be notified when it's ready.
          </div>
        )}

        <div className="mobile-track-header">
          {isCancelled ? (
            <h1 className="mobile-track-title" style={{ color: 'var(--ck-action)' }}>Cancelled</h1>
          ) : isReady ? (
            <h1 className="mobile-track-title" style={{ color: 'var(--ck-green)' }}>Ready!</h1>
          ) : (
            <h1 className="mobile-track-title">Tracking</h1>
          )}
          <p className="mobile-track-sub">Pickup at {order.storeBranch}</p>
        </div>

        {!isCancelled && (
          <div className="mobile-track-timeline">
            {STEPS.map((step, i) => {
              const reached = i <= currentIdx;
              const active = i === currentIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className={`mobile-track-step ${reached ? 'reached' : ''} ${active ? 'active' : ''}`}>
                  <div className="mobile-track-icon-wrap">
                    <div className="mobile-track-icon"><Icon size={18} /></div>
                    {i !== STEPS.length - 1 && <div className="mobile-track-line" />}
                  </div>
                  <div className="mobile-track-text">
                    <div className="mobile-track-label">{step.label}</div>
                    <div className="mobile-track-sub-label">{step.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mobile-track-card">
          <div className="mobile-track-row">
            <Clock size={16} /> <span>{order.customer?.pickupTime}</span>
          </div>
          <div className="mobile-track-row">
            <Phone size={16} /> <span>{order.customer?.phone}</span>
          </div>
        </div>

        <div className="mobile-track-items">
          <h3>Your Order</h3>
          {order.items.map((it, i) => (
            <div key={i} className="mobile-track-item">
              <div className="mobile-track-item-img"><ItemImage src={it.image} alt={it.name} /></div>
              <div className="mobile-track-item-name">{it.name}</div>
              <div className="mobile-track-item-qty">x{it.qty}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}