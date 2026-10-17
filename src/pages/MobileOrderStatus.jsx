import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ChefHat, CheckCircle2, Clock, Phone } from 'lucide-react';
import { getHistory } from '../services/customerService';
import { getOrders, subscribeToOrders } from '../services/orderService';
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

  useEffect(() => {
    const load = async () => {
      // Await the promise from Supabase
      const liveOrders = await getOrders();
      const live = liveOrders.find(o => o.id === id);
      
      if (live) {
        setOrder(live);
      } else {
        const hist = await getHistory();
        const past = hist.find(h => h.id === id);
        if (past) setOrder(past);
      }
      setLoading(false);
    };

    load();
    const unsub = subscribeToOrders(load);
    const i = setInterval(load, 5000);
    return () => { unsub(); clearInterval(i); };
  }, [id]);

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
            <Clock size={16} /> <span>{order.pickupTime || order.customer?.pickupTime || 'ASAP'}</span>
          </div>
          <div className="mobile-track-row">
            <Phone size={16} /> <span>{order.customer?.phone || 'N/A'}</span>
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