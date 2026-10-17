import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useHaptics } from '../hooks/useHaptics';
import CKMark from './CKMark';

export default function SplashScreen() {
  const haptics = useHaptics();

  useEffect(() => {
    // Give a satisfying haptic thud when the app is ready
    const timer = setTimeout(() => {
      haptics.medium();
    }, 1800);
    return () => clearTimeout(timer);
  }, [haptics]);

  return (
    <motion.div 
      className="ck-splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Dynamic Background */}
      <motion.div 
        className="ck-splash-bg"
        animate={{ 
          background: [
            "radial-gradient(circle at 50% 50%, #1e5f9c 0%, #0f2e4a 100%)",
            "radial-gradient(circle at 50% 50%, #2ba8d4 0%, #0f2e4a 100%)",
            "radial-gradient(circle at 50% 50%, #1e5f9c 0%, #0f2e4a 100%)"
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="ck-splash-content">
        
        {/* Pulsing Ring + Logo */}
        <div className="ck-splash-logo-wrap">
          <motion.div 
            className="ck-splash-ring"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <CKMark size={110} variant="gradient" />
          </motion.div>
        </div>

        {/* Text Sequence */}
        <div className="ck-splash-text-wrap">
          <motion.h1 
            className="ck-splash-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
          >
            CeeKay
          </motion.h1>
          <motion.p 
            className="ck-splash-tagline"
            initial={{ opacity: 0, letterSpacing: "1em" }}
            animate={{ opacity: 1, letterSpacing: "0.3em" }}
            transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
          >
            Emporium
          </motion.p>
        </div>

        {/* Gold Loading Bar */}
        <motion.div 
          className="ck-splash-loader-track"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div 
            className="ck-splash-loader-fill"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.1, duration: 1.2, ease: "easeInOut" }}
          />
        </motion.div>

      </div>
    </motion.div>
  );
}