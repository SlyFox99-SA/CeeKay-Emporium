import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, ReceiptText } from 'lucide-react';
import { getHistory } from '../services/customerService';
import ItemImage from './ItemImage';

export default function MobileOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const history = await getHistory();
      setOrders(history || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="m-empty-state"><div className="m-empty-title">Loading orders...</div></div>;
  }

  if (orders.length === 0) {
    return (
      <div style={{ paddingTop: 60 }}>
        <div className="m-empty-state">
          <div className="m-empty-icon-wrap">
            <ReceiptText size={40} strokeWidth={1.5} color="var(--ck-brand)" />
          </div>
          <h2 className="m-empty-title">No orders yet</h2>
          <p className="m-empty-sub">Your past kotas will show up here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="m-orders-list">
      {orders.map((order) => (
        <Link key={order.id} to={`/order/${order.id}`} className="m-order-card">
          
          <div className="m-order-top">
            <div className="m-order-id">#{order.id}</div>
            <div className={`m-order-status status-${order.status}`}>
              {order.status === 'placed' && 'New'}
              {order.status === 'preparing' && 'Preparing'}
              {order.status === 'ready' && 'Ready!'}
              {order.status === 'completed' && 'Collected'}
              {order.status === 'cancelled' && 'Cancelled'}
            </div>
          </div>
          
          <div className="m-order-date">
            <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>

          <div className="m-order-items">
            {order.items.slice(0, 3).map((item, i) => (
              <div key={i} className="m-order-item-thumb">
                <ItemImage src={item.image} alt={item.name} />
                {item.qty > 1 && <span className="m-order-item-qty">{item.qty}</span>}
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="m-order-item-more">+{order.items.length - 3}</div>
            )}
          </div>

          <div className="m-order-bottom">
            <div className="m-order-total">R {order.total.toFixed(2)}</div>
            <div className="m-order-track">Track order <ChevronRight size={14} /></div>
          </div>
        </Link>
      ))}
    </div>
  );
}