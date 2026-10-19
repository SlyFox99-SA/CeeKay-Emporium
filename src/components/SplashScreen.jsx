import { motion } from 'framer-motion';
import CKMark from './CKMark';

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{ 
        position: 'fixed', inset: 0, zIndex: 999999, 
        backgroundColor: '#0F2E4A', // Deep brand blue
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* 1. The Pulsating Ambient Ring */}
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1], 
          opacity: [0.1, 0.3, 0.1],
          boxShadow: [
            "0 0 0px rgba(255, 255, 255, 0)",
            "0 0 40px rgba(255, 255, 255, 0.2)",
            "0 0 0px rgba(255, 255, 255, 0)"
          ]
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          width: '200px', height: '200px',
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      />

      {/* 2. The Logo (Floating inside the ring) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
      >
        {/* Main Logo Mark */}
        <div style={{ transform: 'scale(2.5)', marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' }}>
          <CKMark />
        </div>
        
        {/* Brand Name */}
        <h1 style={{ 
          fontFamily: 'var(--ck-font-serif, "Fraunces", serif)', 
          fontSize: '28px', 
          color: 'white', 
          margin: 0, 
          letterSpacing: '0.05em' 
        }}>
          CeeKay
        </h1>
        <p style={{ 
          fontFamily: 'var(--ck-font-display, "Bricolage Grotesque", sans-serif)', 
          fontSize: '12px', 
          color: 'rgba(255,255,255,0.6)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.3em',
          margin: 0
        }}>
          Emporium
        </p>
      </motion.div>

      {/* 3. The Leading Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ position: 'absolute', bottom: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
      >
        <div style={{ 
          width: '160px', height: '4px', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '99px', overflow: 'hidden' 
        }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
            style={{ height: '100%', backgroundColor: 'var(--ck-warm, #D4AF37)', borderRadius: '99px' }}
          />
        </div>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}
        >
          Preparing your order
        </motion.span>
      </motion.div>
    </motion.div>
  );
}