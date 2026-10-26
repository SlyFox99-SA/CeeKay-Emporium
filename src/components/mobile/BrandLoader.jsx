 

import { motion } from 'framer-motion';
import { Sandwich } from 'lucide-react';

export default function BrandLoader() {
  return (
    <div className="brand-loader">
      <div className="brand-loader-content">
        
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="brand-loader-icon"
        >
          <Sandwich size={64} strokeWidth={1.5} color="var(--ck-brand)" />
        </motion.div>

        {/* Pulsing Text */}
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="brand-loader-text"
        >
          Cooking up the menu...
        </motion.div>

        {/* Loading Bar */}
        <div className="brand-loader-bar-track">
          <motion.div 
            className="brand-loader-bar-fill"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          />
        </div>

      </div>
    </div>
  );
}

