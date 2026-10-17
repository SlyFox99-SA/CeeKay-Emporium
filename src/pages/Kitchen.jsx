import { useEffect, useState, useCallback, useRef } from 'react';
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
import { playChime, primeAudio } from '../lib/chime';
import PwaInstallBanner from '../components/mobile/PwaInstallBanner';
import NetworkStatus from '../components/NetworkStatus';
import EmptyState from '../components/mobile/EmptyState';

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
  const [activeTab, setActiveTab] = useState('placed');
  const [, setTick] = useState(0);
  
  const boardRef = useRef(null);
  const columnRefs = useRef({});

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

  // Unlock audio on first tap
  useEffect(() => {
    const unlock = () => { primeAudio(); document.removeEventListener('click', unlock); };
    document.addEventListener('click', unlock);
    return () => document.removeEventListener('click', unlock);
  }, []);

  // Handle scroll to update active tab
  const handleScroll = () => {
    if (!boardRef.current) return;
    const board = boardRef.current;
    const scrollLeft = board.scrollLeft;
    const width = board.clientWidth;
    
    // Calculate which column is currently in view
    const index = Math.round(scrollLeft / width);
    if (COLUMNS[index]) setActiveTab(COLUMNS[index]);
  };

  const scrollToColumn = (col) => {
    setActiveTab(col);
    if (boardRef.current && columnRefs.current[col]) {
      columnRefs.current[col].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

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
    if (confirm(`Cancel order ${order.id}? This cannot be undone.`)) {
      updateOrderStatus(order.id, 'cancelled');
    }
  }, []);

  const testAlerts = () => {
    playChime().catch(() => {});
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Test notification', { body: 'This is what a new order will look like.' });
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
            <button className="kitchen-icon-btn" onClick={testAlerts} title="Test sound">
              <Volume2 size={16} />
            </button>
          )}

          <button
            className={`kitchen-icon-btn ${enabled ? 'active' : ''}`}
            onClick={() => setEnabled(v => !v)}
          >
            {enabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>

          <button className="kitchen-icon-btn" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
          </button>

          <Link to="/" className="kitchen-icon-btn">
            <ArrowLeft size={16} />
          </Link>
        </div>
      </header>

      {enabled && permission === 'denied' && (
        <div className="kitchen-alert-banner">
          Notifications blocked. The chime still works.
        </div>
      )}

      {/* MOBILE TABS (Visible only on mobile via CSS) */}
      <div className="kitchen-mobile-tabs">
        {COLUMNS.map(col => (
          <button 
            key={col}
            className={`kitchen-tab-btn ${activeTab === col ? 'active' : ''}`}
            onClick={() => scrollToColumn(col)}
          >
            {STATUS_LABELS[col]} 
            {grouped[col].length > 0 && <span className="tab-badge">{grouped[col].length}</span>}
          </button>
        ))}
      </div>

      <NetworkStatus />
      <PwaInstallBanner />
      <div className="kitchen-board" ref={boardRef} onScroll={handleScroll}>
        {COLUMNS.map(col => (
          <section 
            key={col} 
            className={`kitchen-column col-${col}`}
            ref={el => columnRefs.current[col] = el}
          >
            <header className="kitchen-column-head">
              <span className="kitchen-column-name">{STATUS_LABELS[col]}</span>
              <span className="kitchen-column-count">{grouped[col].length}</span>
            </header>

            <div className="kitchen-column-body">
              {grouped[col].length === 0 ? (
                <div style={{ padding: '40px 10px' }}>
                  <EmptyState 
                    type="kitchen" 
                    title="All caught up" 
                    subtitle="No orders in this stage." 
                  />
                </div>
              ) : grouped[col].map(order => (
                <article key={order.id} className="kitchen-card">
                  
                  <div className="kitchen-card-head" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <div className="kitchen-order-id">#{order.id}</div>
                      <div className="kitchen-branch" style={{ marginTop: 4 }}>{order.storeBranch}</div>
                    </div>
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button className="kitchen-btn-cancel-top" onClick={() => cancel(order)}>
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="kitchen-time">
                    <Clock size={12} /> {elapsed(order.createdAt)}
                  </div>

                  {order.customer && (order.customer.name || order.customer.phone) && (
                    <div className="kitchen-customer">
                      {order.customer.name && <div className="kitchen-customer-name">{order.customer.name}</div>}
                      <div className="kitchen-customer-row">
                        {order.customer.phone && (
                          <a href={`tel:${order.customer.phone.replace(/\s/g, '')}`} className="kitchen-customer-phone">
                            <Phone size={11} /> {order.customer.phone}
                          </a>
                        )}
                        {order.customer.pickupTime && <span className="kitchen-customer-time">Â· {order.customer.pickupTime}</span>}
                      </div>
                    </div>
                  )}

                  <ul className="kitchen-items">
                    {order.items.map((it, i) => (
                      <li key={i}>
                        <span className="kitchen-item-thumb"><ItemImage src={it.image} alt={it.name} /></span>
                        <span className="kitchen-item-qty">{it.qty}x</span>
                        <span className="kitchen-item-name">{it.name}</span>
                      </li>
                    ))}
                  </ul>

                  {order.note && (
                    <div className="kitchen-note"><strong>Note:</strong> {order.note}</div>
                  )}

                  <div className="kitchen-card-foot">
                    <span className="kitchen-total">R {order.total.toFixed(2)}</span>
                    <div className="kitchen-actions">
                      {order.status === 'placed' && (
                        <button className="kitchen-btn-primary" onClick={() => advance(order)}><Play size={16} /> Start Order</button>
                      )}
                      {order.status === 'preparing' && (
                        <button className="kitchen-btn-primary" onClick={() => advance(order)}><CheckCircle2 size={16} /> Mark Ready</button>
                      )}
                      {order.status === 'ready' && (
                        <button className="kitchen-btn-success" onClick={() => advance(order)}><CheckCircle2 size={16} /> Collected</button>
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