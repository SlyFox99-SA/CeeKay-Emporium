import { useEffect, useState } from 'react';
import { Receipt, Search, CheckCircle2, Play, XCircle, Clock } from 'lucide-react';
import { getOrders, updateOrderStatus, subscribeToOrders, STATUS_LABELS } from '../../services/orderService';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = subscribeToOrders((next) => setOrders(next));
    return unsub;
  }, []);

  const advance = async (order, nextStatus) => {
    await updateOrderStatus(order.id, nextStatus);
  };

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchName = o.customer?.name?.toLowerCase().includes(q);
      const matchPhone = o.customer?.phone?.includes(q);
      if (!matchId && !matchName && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <div className="admin-page-eyebrow">Manage</div>
          <h1 className="admin-page-title">Orders</h1>
        </div>
      </header>

      <div className="admin-filters">
        <div className="admin-filter-tabs">
          {['all', 'placed', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              className={`admin-filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? 'All Orders' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        <div className="admin-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by ID, name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading-inline">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-title">No orders found.</div>
          <div className="admin-empty-sub">Try adjusting your filters or search.</div>
        </div>
      ) : (
        <div className="admin-table admin-table-orders">
          <div className="admin-table-head">
            <div>Order</div>
            <div>Customer</div>
            <div>Total</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {filtered.map((order) => (
            <div key={order.id} className="admin-table-row">
              <div>
                <div className="admin-order-id">#{order.id}</div>
                <div className="admin-order-time">
                  <Clock size={11} /> {new Date(order.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div>
                <div className="admin-customer-name">{order.customer?.name || 'Guest'}</div>
                <div className="admin-customer-phone">{order.customer?.phone || 'No phone'}</div>
              </div>
              <div className="admin-order-total">R {order.total.toFixed(2)}</div>
              <div>
                <span className={`admin-pill status-${order.status}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="admin-table-actions">
                {order.status === 'placed' && (
                  <button className="admin-btn-advance" onClick={() => advance(order, 'preparing')}>
                    <Play size={13} /> Start
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button className="admin-btn-advance" onClick={() => advance(order, 'ready')}>
                    <CheckCircle2 size={13} /> Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button className="admin-btn-advance success" onClick={() => advance(order, 'completed')}>
                    <CheckCircle2 size={13} /> Collect
                  </button>
                )}
                {(order.status === 'placed' || order.status === 'preparing') && (
                  <button className="admin-btn-cancel" onClick={() => advance(order, 'cancelled')} title="Cancel">
                    <XCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}