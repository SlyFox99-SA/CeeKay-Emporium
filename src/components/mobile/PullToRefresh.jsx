
import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import CKMark from '../CKMark';

export default function PullToRefresh({ onRefresh, children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef(null);
  
  const pullY = useMotionValue(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const rotate = useTransform(pullY, [0, 100], [0, 360]);
  const scale = useTransform(pullY, [0, 80, 150], [0.5, 1, 1.2]);
  const opacity = useTransform(pullY, [0, 40, 100], [0, 0, 1]);

  const handleTouchStart = (e) => {
    if (scrollRef.current?.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current) return;
    const distance = e.touches[0].clientY - startY.current;

    if (distance > 0) {
      if (e.cancelable) e.preventDefault(); 
      pullY.set(Math.pow(distance, 0.8) * 2.5);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullY.get() > 80) {
      setIsRefreshing(true);
      animate(pullY, 60, { type: "spring", stiffness: 300, damping: 20 });
      
      try { await onRefresh(); } 
      finally {
        setTimeout(() => {
          animate(pullY, 0, { type: "spring", stiffness: 300, damping: 20 });
          setIsRefreshing(false);
        }, 500); 
      }
    } else {
      animate(pullY, 0, { type: "spring", stiffness: 300, damping: 20 });
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="mobile-scroll-area" 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      <motion.div 
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          x: '-50%',
          y: pullY,
          rotate,
          scale,
          opacity,
          zIndex: 10,
          marginTop: '-60px'
        }}
      >
        <div style={{ background: '#fff', borderRadius: '50%', padding: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <CKMark size={32} variant="gradient" />
        </div>
      </motion.div>

      {children}
    </div>
  );
}
