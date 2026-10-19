import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function CancelConfirmModal({ isOpen, onClose, onConfirm, isCancelling }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }} 
          />
          
          {/* Bottom Sheet */}
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ 
              position: 'fixed', bottom: 0, left: 0, right: 0, 
              background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', 
              padding: '32px 24px calc(24px + env(safe-area-inset-bottom))', 
              zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' 
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(229, 57, 53, 0.1)', color: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={32} />
            </div>
            
            <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', margin: '0 0 8px', color: 'var(--ck-ink)' }}>Cancel Order?</h2>
            <p style={{ fontSize: '14px', color: 'var(--ck-ink-soft)', margin: '0 0 24px', lineHeight: 1.5 }}>Are you sure you want to cancel this order? Your items will be returned to stock.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '16px' }}>
              <button 
                onClick={onConfirm} 
                disabled={isCancelling} 
                style={{ width: '100%', height: '56px', backgroundColor: '#D32F2F', color: '#FFFFFF', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '16px', cursor: isCancelling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
              
              <button 
                onClick={onClose} 
                style={{ width: '100%', height: '56px', background: 'var(--ck-cream)', color: 'var(--ck-ink)', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Keep My Order
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}