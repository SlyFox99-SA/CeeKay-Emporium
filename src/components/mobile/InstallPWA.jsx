/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    const isDismissed = sessionStorage.getItem('ck_pwa_dismissed');
    if (isDismissed) setIsVisible(false);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClickInstall = async () => {
    if (!promptInstall) return;
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('ck_pwa_dismissed', 'true');
  };

  if (!supportsPWA || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 150, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed', bottom: '90px', left: '16px', right: '16px',
          backgroundColor: 'var(--ck-brand-deep)', color: 'var(--ck-cream)',
          borderRadius: '16px', padding: '16px', display: 'flex', 
          alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 9999,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--ck-warm)', padding: '8px', borderRadius: '12px' }}>
            <Download size={20} color="var(--ck-brand-deep)" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', fontFamily: 'Bricolage Grotesque' }}>Install CeeKay</p>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8, fontFamily: 'Inter' }}>Fast, offline-ready app experience</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={onClickInstall} style={{ backgroundColor: 'var(--ck-cream)', color: 'var(--ck-brand-deep)', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter' }}>Install</button>
          <button onClick={handleDismiss} style={{ background: 'transparent', border: 'none', color: 'var(--ck-cream)', opacity: 0.6, cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWA;
