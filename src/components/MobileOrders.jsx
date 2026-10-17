import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, ReceiptText } from 'lucide-react';
import { getHistory } from '../services/customerService';
import ItemImage from './ItemImage';
import EmptyState from './mobile/EmptyState';

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
    return <div className="mobile-orders-loading">Loading your ordersâ€¦</div>;
  }

  if (orders.length === 0) {
    return (
      <div style={{ paddingTop: 60 }}>
        <EmptyState 
          type="orders" 
          title="No orders yet" 
          subtitle="When you place an order, you can track it here." 
        />
      </div>
    );
  }

  return (
    <div className="mobile-orders">
      <div className="mobile-orders-header">
        <h1>My Orders</h1>
      </div>
      <div className="mobile-orders-list">
        {orders.map((order) => (
          <Link key={order.id} to={`/order/${order.id}`} className="mobile-order-card">
            <div className="mobile-order-top">
              <div className="mobile-order-id">#{order.id}</div>
              <div className={`mobile-order-status status-${order.status}`}>
                {order.status === 'placed' && 'New'}
                {order.status === 'preparing' && 'Preparing'}
                {order.status === 'ready' && 'Ready!'}
                {order.status === 'completed' && 'Collected'}
                {order.status === 'cancelled' && 'Cancelled'}
              </div>
            </div>
            
            <div className="mobile-order-date">
              <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>

            <div className="mobile-order-items">
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="mobile-order-item-thumb">
                  <ItemImage src={item.image} alt={item.name} />
                  {item.qty > 1 && <span className="mobile-order-item-qty">{item.qty}</span>}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="mobile-order-item-more">+{order.items.length - 3}</div>
              )}
            </div>

            <div className="mobile-order-bottom">
              <div className="mobile-order-total">R {order.total.toFixed(2)}</div>
              <div className="mobile-order-track">Track order <ChevronRight size={14} /></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}