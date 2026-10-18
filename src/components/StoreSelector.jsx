import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useHaptics } from '../hooks/useHaptics';

export default function StoreSelector() {
  const { stores, store, selectStore } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const haptics = useHaptics();

  const handleSelect = (id) => {
    haptics.success();
    selectStore(id);
    setIsOpen(false);
  };

  // The modal is rendered into document.body to escape the header's CSS constraints
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
              padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
              zIndex: 9999, boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
              maxHeight: '80vh', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '20px', margin: 0, color: 'var(--ck-ink)' }}>Select Branch</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'var(--ck-cream)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
                <X size={20} color="var(--ck-ink)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stores.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)',
                    background: store?.id === s.id ? 'var(--ck-cream)' : 'white',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MapPin size={18} color="var(--ck-brand-deep)" />
                    <span style={{ fontWeight: 600, color: 'var(--ck-ink)' }}>{s.branch || s.name}</span>
                  </div>
                  {store?.id === s.id && <Check size={18} color="var(--ck-brand-deep)" />}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button 
        onClick={() => { haptics.light(); setIsOpen(true); }}
        className="mobile-store-pill"
        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
      >
        <MapPin size={12} /> 
        {store?.branch || store?.name || 'Select Branch'}
      </button>
      {createPortal(modalContent, document.body)}
    </>
  );
}