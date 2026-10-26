 
import { X, User, Phone, Clock, MessageSquare } from 'lucide-react';
import ItemImage from '../../components/ItemImage';

export default function AdminOrderModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="admin-modal-head">
          <div>
            <div className="admin-page-eyebrow">Order Details</div>
            <h2 className="admin-modal-title">#{order.id}</h2>
          </div>
          <button className="admin-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="admin-modal-body">
          {/* Customer Info */}
          <div className="admin-order-info-grid">
            <div className="admin-order-info-item">
              <User size={16} />
              <div>
                <div className="admin-order-info-label">Customer</div>
                <div className="admin-order-info-value">{order.customer?.name || 'Guest'}</div>
              </div>
            </div>
            <div className="admin-order-info-item">
              <Phone size={16} />
              <div>
                <div className="admin-order-info-label">Phone</div>
                <div className="admin-order-info-value">{order.customer?.phone || 'N/A'}</div>
              </div>
            </div>
            <div className="admin-order-info-item">
              <Clock size={16} />
              <div>
                <div className="admin-order-info-label">Pickup Time</div>
                <div className="admin-order-info-value">{order.customer?.pickupTime || 'ASAP'}</div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="admin-modal-section">
            <div className="admin-form-section-title">Items</div>
            <div className="admin-order-items-list">
              {order.items.map((item, i) => (
                <div key={i} className="admin-order-item">
                  <div className="admin-order-item-img">
                    <ItemImage src={item.image} alt={item.name} />
                  </div>
                  <div className="admin-order-item-details">
                    <div className="admin-order-item-name">
                      {item.qty}x {item.name}
                    </div>
                    {item.removedIngredients?.length > 0 && (
                      <div className="admin-order-item-mod">No {item.removedIngredients.join(', ')}</div>
                    )}
                    {item.itemNote && (
                      <div className="admin-order-item-mod">Note: {item.itemNote}</div>
                    )}
                  </div>
                  <div className="admin-order-item-price">
                    R {(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Note */}
          {order.note && (
            <div className="admin-modal-section">
              <div className="admin-form-section-title"><MessageSquare size={14} /> Order Note</div>
              <div className="admin-order-note-box">
                "{order.note}"
              </div>
            </div>
          )}
        </div>

        <div className="admin-modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ck-ink-muted)' }}>
            Total: <strong style={{ fontSize: 18, color: 'var(--ck-ink)' }}>R {order.total.toFixed(2)}</strong>
          </span>
          <button className="admin-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
