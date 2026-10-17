import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, ArrowLeft, RefreshCw, Clock, CheckCircle2, Play, X, Phone, Bell, BellOff, Volume2 } from 'lucide-react';
import {
  getOrders,
  subscribeToOrders,
  updateOrderStatus,
  ORDER_FLOW,
  STATUS_LABELS,
} from '../services/orderService';
import { STORES } from '../data/stores';
import ItemImage from '../components/ItemImage';
import { useNewOrderAlerts } from '../hooks/useNewOrderAlerts';
import { playChime } from '../lib/chime';

const COLUMNS = ['placed', 'preparing', 'ready', 'completed'];

function elapsed(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [storeFilter, setStoreFilter] = useState('all');
  const [, setTick] = useState(0);

  const { enabled, setEnabled, permission } = useNewOrderAlerts(orders);

  useEffect(() => {
    const unsub = subscribeToOrders((next) => {
      if (Array.isArray(next)) setOrders(next);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(i);
  }, []);

  const filtered = storeFilter === 'all'
    ? orders
    : orders.filter(o => o.storeId === storeFilter);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = filtered.filter(o => o.status === col);
    return acc;
  }, {});

  const nextStatus = (current) => {
    const i = ORDER_FLOW.indexOf(current);
    return i >= 0 && i < ORDER_FLOW.length - 1 ? ORDER_FLOW[i + 1] : null;
  };

  const advance = useCallback((order) => {
    const next = nextStatus(order.status);
    if (next) updateOrderStatus(order.id, next);
  }, []);

  const cancel = useCallback((order) => {
    if (confirm(`Cancel order ${order.id}?`)) updateOrderStatus(order.id, 'cancelled');
  }, []);

  const testAlerts = () => {
    playChime().catch(() => {});
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Test notification', {
          body: 'This is what a new order will look like.',
        });
      } catch {}
    }
  };

  return (
    <div className="kitchen">
      <header className="kitchen-header">
        <div className="kitchen-brand">
          <ChefHat size={26} strokeWidth={2} />
          <div>
            <div className="kitchen-title">Kitchen</div>
            <div className="kitchen-sub">CeeKay Emporium</div>
          </div>
        </div>

        <div className="kitchen-controls">
          <select
            className="kitchen-select"
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
          >
            <option value="all">All stores</option>
            {STORES.map(s => <option key={s.id} value={s.id}>{s.branch}</option>)}
          </select>

          {enabled && (
            <button className="kitchen-icon-btn" onClick={testAlerts} title="Test the alert sound">
              <Volume2 size={16} />
            </button>
          )}

          <button
            className={`kitchen-icon-btn ${enabled ? 'active' : ''}`}
            onClick={() => setEnabled(v => !v)}
            title={enabled ? 'Disable new-order alerts' : 'Enable new-order alerts'}
          >
            {enabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>

          <button className="kitchen-icon-btn" onClick={() => window.location.reload()} title="Refresh">
            <RefreshCw size={16} />
          </button>

          <Link to="/" className="kitchen-icon-btn" title="Back to storefront">
            <ArrowLeft size={16} />
          </Link>
        </div>
      </header>

      {enabled && permission === 'denied' && (
        <div className="kitchen-alert-banner">
          Browser notifications are blocked. The chime still works â€” enable notifications in your browser settings for pop-ups.
        </div>
      )}

      <div className="kitchen-board">
        {COLUMNS.map(col => (
          <section key={col} className={`kitchen-column col-${col}`}>
            <header className="kitchen-column-head">
              <span className="kitchen-column-name">{STATUS_LABELS[col]}</span>
              <span className="kitchen-column-count">{grouped[col].length}</span>
            </header>

            <div className="kitchen-column-body">
              {grouped[col].length === 0 ? (
                <div className="kitchen-empty-state">
                   <div className="kitchen-empty-icon"><ChefHat size={32} /></div>
                   <div className="kitchen-empty-text">Waiting for orders</div>
                 </div>
              ) : grouped[col].map(order => (
                <article key={order.id} className="kitchen-card">
                  <div className="kitchen-card-head">
                    <span className="kitchen-order-id">#{order.id}</span>
                    <span className="kitchen-branch">{order.storeBranch}</span>
                  </div>

                  <div className="kitchen-time">
                    <Clock size={12} /> {elapsed(order.createdAt)}
                  </div>

                  {order.customer && (order.customer.name || order.customer.phone) && (
                    <div className="kitchen-customer">
                      {order.customer.name && (
                        <div className="kitchen-customer-name">{order.customer.name}</div>
                      )}
                      <div className="kitchen-customer-row">
                        {order.customer.phone && (
                          <a
                            href={`tel:${order.customer.phone.replace(/\s/g, '')}`}
                            className="kitchen-customer-phone"
                          >
                            <Phone size={11} /> {order.customer.phone}
                          </a>
                        )}
                        {order.customer.pickupTime && (
                          <span className="kitchen-customer-time">Â· {order.customer.pickupTime}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <ul className="kitchen-items">
                    {order.items.map((it, i) => (
                      <li key={i}>
                        <span className="kitchen-item-thumb">
                          <ItemImage src={it.image} alt={it.name} />
                        </span>
                        <span className="kitchen-item-qty">{it.qty}Ã—</span>
                        <span className="kitchen-item-name">{it.name}</span>
                      </li>
                    ))}
                  </ul>

                  {order.note && (
                    <div className="kitchen-note">
                      <strong>Note:</strong> {order.note}
                    </div>
                  )}

                  <div className="kitchen-card-foot">
                    <span className="kitchen-total">R {order.total.toFixed(2)}</span>
                    <div className="kitchen-actions">
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button
                          className="kitchen-btn kitchen-btn-cancel"
                          onClick={() => cancel(order)}
                          title="Cancel order"
                        >
                          <X size={14} />
                        </button>
                      )}
                      {order.status === 'placed' && (
                        <button className="kitchen-btn kitchen-btn-primary" onClick={() => advance(order)}>
                          <Play size={14} /> Start
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button className="kitchen-btn kitchen-btn-primary" onClick={() => advance(order)}>
                          <CheckCircle2 size={14} /> Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button className="kitchen-btn kitchen-btn-success" onClick={() => advance(order)}>
                          <CheckCircle2 size={14} /> Collected
                        </button>
                      )}
                      {order.status === 'completed' && <span className="kitchen-done">Done</span>}
                      {order.status === 'cancelled' && <span className="kitchen-cancelled">Cancelled</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}