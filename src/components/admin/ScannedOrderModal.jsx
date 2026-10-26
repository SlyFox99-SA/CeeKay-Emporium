 
import { motion } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { updateOrderStatus } from '../../services/orderService';
import { useHaptics } from '../../hooks/useHaptics';

export default function ScannedOrderModal({ order, onClose, onSuccess }) {
  const haptics = useHaptics();

  const handleAction = async (status) => {
    haptics.success();
    await updateOrderStatus(order.id, status);
    onSuccess();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'flex-end' }}
    >
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        style={{ width: '100%', background: 'var(--ck-cream)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--ck-font-serif)', fontSize: '24px', color: 'var(--ck-ink)' }}>Order Verified</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--ck-border)' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ck-brand-deep)', marginBottom: '8px' }}>#{order.order_number || order.id.substring(0,6)}</div>
          <div style={{ fontSize: '14px', color: 'var(--ck-ink-soft)' }}>{order.customer?.name}</div>
          <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>Total: R {Number(order.total).toFixed(2)}</div>
          
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--ck-border)' }}>
            {order.items?.map((item, idx) => (
              <div key={idx} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span><strong>{item.qty}x</strong> {item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {order.status === 'placed' || order.status === 'pending' ? (
            <button onClick={() => handleAction('preparing')} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '16px' }}>
              Mark as Paid & Start Prep
            </button>
          ) : order.status === 'ready' ? (
            <button onClick={() => handleAction('completed')} style={{ width: '100%', padding: '16px', background: 'var(--ck-green)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '16px' }}>
              Mark as Collected
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ck-ink-soft)', padding: '10px' }}>Order is already in progress ({order.status})</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
