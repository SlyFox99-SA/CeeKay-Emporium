
import { motion } from 'framer-motion';
import { ChefHat, RefreshCcw } from 'lucide-react';

export default function ErrorState({ onRetry }) {
  return (
    <div className="m-error-state">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="m-error-icon-wrap"
      >
        <ChefHat size={48} strokeWidth={1.5} />
      </motion.div>
      
      <motion.h2 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="m-error-title"
      >
        Kitchen is taking a break
      </motion.h2>
      
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="m-error-sub"
      >
        We couldn't connect to the store to load the menu. Please check your connection and try again.
      </motion.p>

      <motion.button 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="m-error-btn" 
        onClick={onRetry}
      >
        <RefreshCcw size={18} /> Try Again
      </motion.button>
    </div>
  );
}
