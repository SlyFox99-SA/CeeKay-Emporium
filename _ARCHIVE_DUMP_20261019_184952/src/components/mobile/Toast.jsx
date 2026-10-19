import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ message, onClose }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            bottom: 'calc(80px + env(safe-area-inset-bottom))',
            left: '20px',
            right: '20px',
            background: 'var(--ck-charcoal)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            zIndex: 9999,
            textAlign: 'center',
            cursor: 'pointer',
            wordWrap: 'break-word',
            whiteSpace: 'normal'
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}