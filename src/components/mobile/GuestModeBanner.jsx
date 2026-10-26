/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';
import AuthModal from './AuthModal';

export default function GuestModeBanner() {
  const { user } = useAuth();
  const haptics = useHaptics();
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('ck_guest_dismissed');
    if (dismissed) setIsDismissed(true);
  }, []);

  const handleDismiss = () => {
    haptics.light();
    setIsDismissed(true);
    sessionStorage.setItem('ck_guest_dismissed', 'true');
  };

  if (user || isDismissed) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: 'calc(100% - 60px)',
            maxWidth: '380px',
            backgroundColor: 'var(--ck-brand-deep)',
            color: 'white',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(15, 46, 74, 0.4)',
            zIndex: 9999,
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%' }}>
              <User size={20} color="var(--ck-warm)" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800 }}>Browsing as Guest</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '2px' }}>Sign in to save orders.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => { haptics.light(); setAuthOpen(true); }}
              style={{ 
                background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', 
                border: 'none', padding: '8px 16px', borderRadius: '99px', 
                fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer'
              }}
            >
              Sign In <ArrowRight size={14} />
            </button>
            <button 
              onClick={handleDismiss}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
