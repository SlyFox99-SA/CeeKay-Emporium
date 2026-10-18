
import { motion } from 'framer-motion';
import CKMark from './CKMark';

export default function SplashScreen() {
  return (
    <motion.div 
      className="ck-splash-screen"
      initial={{ opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ck-splash-bg" />
      
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
