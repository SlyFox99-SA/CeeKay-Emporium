 
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChefHat, Package, CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';
import { getHistory, updateHistoryStatus } from '../services/customerService';
import { getOrders, subscribeToOrders } from '../services/orderService';
import ItemImage from '../components/ItemImage';

const STEPS = [
  { key: 'placed',    label: 'Placed',    sub: 'We got your order' },
  { key: 'preparing', label: 'Preparing', sub: 'On the flat-top now' },
  { key: 'ready',     label: 'Ready',     sub: 'Ready for pickup' },
  { key: 'completed', label: 'Collected', sub: 'Enjoy it' },
];

export default function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Await the promise from Supabase
      const liveOrders = await getOrders();
      const live = liveOrders.find(o => o.id === id);
      
      if (live) {
        setOrder(live);
        updateHistoryStatus(id, live.status);
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

  if (loading) {
    return (
      <div className="status-page">
        <div className="status-loading">Looking up your order…</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="status-page">
        <div className="status-empty">
          <h1>Order not found</h1>
          <p>We couldn't find an order with ID <strong>#{id}</strong> on this device.</p>
          <Link to="/" className="status-back-link">
            <ArrowLeft size={14} /> Back to menu
          </Link>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex(s => s.key === order.status);
  const cancelled = order.status === 'cancelled';
  const isReady = order.status === 'ready' || order.status === 'completed';

  return (
    <div className="status-page">
      <header className="status-header">
        <Link to="/" className="status-back-link">
          <ArrowLeft size={14} /> Menu
        </Link>
        <div className="status-header-label">Order status</div>
      </header>

      <main className="status-main">
        <div className="status-title-block">
          <div className="status-eyebrow">Order</div>
          <h1 className="status-id">#{order.id}</h1>
          {isReady && !cancelled && (
            <div className="status-ready-badge">
              <CheckCircle2 size={16} /> It's ready!
            </div>
          )}
          {cancelled && (
            <div className="status-cancelled-badge">Cancelled</div>
          )}
        </div>

        {!cancelled && (
          <ol className="status-steps">
            {STEPS.map((step, i) => {
              const reached = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <li key={step.key} className={`status-step ${reached ? 'reached' : ''} ${active ? 'active' : ''}`}>
                  <div className="status-step-dot">
                    {step.key === 'placed'    && <Package size={16} />}
                    {step.key === 'preparing' && <ChefHat size={16} />}
                    {step.key === 'ready'     && <CheckCircle2 size={16} />}
                    {step.key === 'completed' && <CheckCircle2 size={16} />}
                  </div>
                  <div className="status-step-text">
                    <div className="status-step-label">{step.label}</div>
                    <div className="status-step-sub">{step.sub}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="status-card">
          <div className="status-card-row">
            <span className="status-card-label"><MapPin size={12} /> Pickup from</span>
            <span className="status-card-value">{order.storeBranch || 'Benoni'}</span>
          </div>
          <div className="status-card-row">
            <span className="status-card-label"><Clock size={12} /> When</span>
            <span className="status-card-value">{order.pickupTime || order.customer?.pickupTime || 'ASAP'}</span>
          </div>
          {order.customer?.phone && (
            <div className="status-card-row">
              <span className="status-card-label"><Phone size={12} /> We'll call</span>
              <span className="status-card-value">{order.customer.phone}</span>
            </div>
          )}
        </div>

        <div className="status-items">
          <div className="status-items-label">Your order</div>
          {order.items.map((it, i) => (
            <div key={i} className="status-item">
              <span className="status-item-thumb">
                <ItemImage src={it.image} alt={it.name} />
              </span>
              <span className="status-item-name">{it.name}</span>
              <span className="status-item-qty">× {it.qty}</span>
              <span className="status-item-price">R {(it.price * it.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="status-item-total">
            <span>Total</span>
            <strong>R {order.total.toFixed(2)}</strong>
          </div>
        </div>

        <div className="status-foot">
          <div className="status-foot-note">
            This page updates automatically. Bookmark it to check in.
          </div>
        </div>
      </main>
    </div>
  );
}
