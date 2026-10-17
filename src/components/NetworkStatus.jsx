import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useEffect, useState } from 'react';

export default function NetworkStatus() {
  const isOnline = useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (isOnline) {
      // If we just came back online, show a success message briefly
      if (showRestored === false) {
         setShowRestored(true);
         const timer = setTimeout(() => setShowRestored(false), 3000);
         return () => clearTimeout(timer);
      }
    } else {
      setShowRestored(false);
    }
  }, [isOnline]);

  // Hide banner if online and no "restored" message is needed
  if (isOnline && !showRestored) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`network-banner ${isOnline ? 'online' : 'offline'}`}
      >
        {!isOnline ? (
          <>
            <WifiOff size={18} />
            <span>No internet connection</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={18} />
            <span>Connection restored</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}