import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import CKMark from './CKMark';

const Embers = () => {
  const [embers] = useState(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
      size: Math.random() * 6 + 2
    }))
  );

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 15, pointerEvents: 'none' }}>
      {embers.map((e) => (
        <motion.div
          key={e.id}
          initial={{ y: '110vh', x: e.x + 'vw', opacity: 0 }}
          animate={{ y: '-10vh', opacity: [0, 0.8, 0] }}
          transition={{ duration: e.duration, repeat: Infinity, delay: e.delay, ease: "linear" }}
          style={{
            position: 'absolute',
            width: e.size, height: e.size,
            backgroundColor: '#D4AF37',
            borderRadius: '50%',
            boxShadow: '0 0 10px #D4AF37',
            willChange: 'transform, opacity'
          }}
        />
      ))}
    </div>
  );
};

export default function SplashScreen() {
  const [loadingText, setLoadingText] = useState('PREHEATING...');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLoadingText('FIRING UP THE GRILL...'), 2000);
    const t2 = setTimeout(() => setLoadingText('PILING ON THE CHIPS...'), 3500);
    const t3 = setTimeout(() => setLoadingText('ALMOST READY...'), 5000);
    const doorTimer = setTimeout(() => setIsOpen(true), 5500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(doorTimer); };
  }, []);

  return (
    <motion.div 
      exit={{ scale: 2, opacity: 0, transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] } }}
      style={{ position: 'fixed', inset: 0, zIndex: 999999, overflow: 'hidden', backgroundColor: '#0F2E4A', transformOrigin: 'center center', willChange: 'transform, opacity' }}
    >
      
      <Embers />

      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isOpen ? '-100%' : 0 }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%',
          backgroundColor: '#0F2E4A',
          borderRight: '1px solid rgba(212, 175, 55, 0.2)',
          zIndex: 10,
          boxShadow: isOpen ? '10px 0 50px rgba(0,0,0,0.5)' : 'none',
          willChange: 'transform'
        }}
      />

      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isOpen ? '100%' : 0 }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%',
          backgroundColor: '#0F2E4A',
          borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
          zIndex: 10,
          boxShadow: isOpen ? '-10px 0 50px rgba(0,0,0,0.5)' : 'none',
          willChange: 'transform'
        }}
      />

      <motion.div
        initial={{ opacity: 0, scaleX: 0, scaleY: 0 }}
        animate={{ 
          opacity: isOpen ? [0, 1, 0] : 0, 
          scaleX: isOpen ? [0.1, 2, 3] : 0.1,
          scaleY: isOpen ? [0.1, 1, 2] : 0.1
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '100vw', height: '100vh',
          background: 'radial-gradient(ellipse at center, #FFFFFF 0%, #D4AF37 20%, transparent 60%)',
          zIndex: 5, pointerEvents: 'none', filter: 'blur(40px)',
          willChange: 'transform, opacity'
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? [0, 0.8, 0] : 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          position: 'absolute', inset: 0, backgroundColor: '#FFFFFF', zIndex: 6, pointerEvents: 'none',
          willChange: 'opacity'
        }}
      />

      <motion.div
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 1.5 : 1 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
        style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          willChange: 'transform, opacity'
        }}
      >
        <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="120" cy="120" r="110" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
            <motion.circle
              cx="120" cy="120" r="110"
              stroke="#D4AF37"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 1000" }}
              animate={{ strokeDasharray: "691 1000" }} 
              transition={{ duration: 5.2, ease: "anticipate" }}
              style={{ filter: 'drop-shadow(0 0 8px #D4AF37)' }}
            />
          </svg>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{
              position: 'absolute', inset: '-20px', borderRadius: '50%',
              border: '1px dashed rgba(212, 175, 55, 0.3)'
            }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            style={{ transform: 'scale(3)' }}
          >
            <CKMark />
          </motion.div>
        </div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.4 }}
          style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '42px', color: 'white', margin: '40px 0 0 0', letterSpacing: '0.02em' }}
        >
          CeeKay
        </motion.h1>
        
        <motion.p 
          initial={{ letterSpacing: '0em', opacity: 0 }}
          animate={{ letterSpacing: '0.6em', opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.6 }}
          style={{ fontFamily: 'var(--ck-font-display)', fontSize: '14px', color: '#D4AF37', textTransform: 'uppercase', margin: '8px 0 32px 0', fontWeight: 900 }}
        >
          Emporium
        </motion.p>

        <div style={{ height: '20px', position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={loadingText}
              initial={{ y: 15, opacity: 0, filter: 'blur(5px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -15, opacity: 0, filter: 'blur(5px)' }}
              transition={{ duration: 0.4 }}
              style={{ 
                position: 'absolute', fontSize: '12px', color: 'rgba(255,255,255,0.7)', 
                textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 700
              }}
            >
              {loadingText}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>

    </motion.div>
  );
}