import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// The distance (in pixels) the user must pull down to trigger the refresh
const THRESHOLD = 80; 

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const isPulling = useRef(false);
  const controls = useAnimation();

  const handleTouchStart = (e) => {
    // Only allow pull-to-refresh if the user is at the very top of the page
    if (window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    // Only track downward pulls
    if (deltaY > 0) {
      // Prevent the native browser pull-to-refresh
      if (e.cancelable) e.preventDefault(); 
      
      // Add some resistance to the pull (makes it feel heavier)
      const adjustedDistance = Math.min(deltaY * 0.4, 120);
      setPullDistance(adjustedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      // The user pulled far enough. Trigger the refresh.
      setIsRefreshing(true);
      setPullDistance(THRESHOLD); // Lock it at the threshold while refreshing
      
      try {
        await onRefresh();
      } finally {
        // Wait a tiny bit so the user sees it finished, then snap back
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      // The user didn't pull far enough. Snap back to the top.
      setPullDistance(0);
    }
  };

  const rotation = Math.min((pullDistance / THRESHOLD) * 180, 180);

  return (
    <div 
      style={{ position: 'relative', minHeight: '100%' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* The Pull Indicator */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60px',
        marginTop: '-60px', // Hide it above the screen
        pointerEvents: 'none'
      }}>
        <motion.div
          animate={{ 
            y: pullDistance,
            rotate: isRefreshing ? 360 : rotation,
            opacity: pullDistance > 0 ? 1 : 0
          }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "spring", stiffness: 300, damping: 20 }}
          style={{ 
            background: 'white', 
            borderRadius: '50%', 
            padding: '10px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <RefreshCw size={20} color="var(--ck-brand-deep)" />
        </motion.div>
      </div>

      {/* The Page Content */}
      <motion.div
        animate={{ y: pullDistance }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {children}
      </motion.div>
    </div>
  );
}