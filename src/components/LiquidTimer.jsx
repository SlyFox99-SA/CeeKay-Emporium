import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LiquidTimer({ prepStartedAt, totalMinutes = 12 }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!prepStartedAt) return;

    const calculateTime = () => {
      const start = new Date(prepStartedAt).getTime();
      const target = start + totalMinutes * 60 * 1000;
      const now = new Date().getTime();
      setTimeLeft(target - now);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [prepStartedAt, totalMinutes]);

  if (!prepStartedAt || timeLeft === null) return null;

  const isReady = timeLeft <= 0;
  const totalMs = totalMinutes * 60 * 1000;
  const elapsed = Math.max(0, totalMs - timeLeft);
  const progress = Math.min(100, (elapsed / totalMs) * 100);

  const minutes = Math.floor(Math.max(0, timeLeft) / 60000);
  const seconds = Math.floor((Math.max(0, timeLeft) % 60000) / 1000);

  // The liquid rectangle moves from Y=100 (bottom) to Y=0 (top)
  const liquidY = 100 - progress;
  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Pulsing background aura */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
          backgroundColor: isReady ? 'rgba(76, 175, 80, 0.4)' : 'rgba(212, 175, 55, 0.2)'
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: 'absolute', inset: -10, borderRadius: '50%', filter: 'blur(12px)', zIndex: 0 }}
      />

      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        <defs>
          <clipPath id="circleClip">
            <circle cx="50" cy="50" r="46" />
          </clipPath>
          <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isReady ? '#66BB6A' : 'var(--ck-warm)'} />
            <stop offset="100%" stopColor={isReady ? '#2E7D32' : 'var(--ck-brand)'} />
          </linearGradient>
        </defs>

        {/* The Dark Glass Sphere */}
        <circle cx="50" cy="50" r="46" fill="var(--ck-brand-deep)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* The Liquid Fill & Wave */}
        <g clipPath="url(#circleClip)">
          
          {/* The static liquid body that rises */}
          <motion.rect
            x="0"
            width="100"
            fill="url(#liquidGrad)"
            initial={{ y: 100, height: 0 }}
            animate={{ y: liquidY, height: 100 }}
            transition={{ duration: 1, ease: "linear" }}
          />

          {/* The Animated Wave on top (Using Native SVG Animation for 60fps) */}
          <motion.g
            initial={{ y: 100 }}
            animate={{ y: liquidY }}
            transition={{ duration: 1, ease: "linear" }}
          >
            {/* Wave 1 */}
            <path
              d="M -100 0 Q -50 -8 0 0 T 100 0 T 200 0 L 200 100 L -100 100 Z"
              fill="url(#liquidGrad)"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="100 0"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            {/* Wave 2 (Slightly offset and lighter for depth) */}
            <path
              d="M -100 0 Q -50 8 0 0 T 100 0 T 200 0 L 200 100 L -100 100 Z"
              fill="rgba(255,255,255,0.15)"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from="100 0"
                to="0 0"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </motion.g>
        </g>

        {/* Outer glowing progress ring */}
        <circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke={isReady ? 'var(--ck-green)' : 'var(--ck-warm)'}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>

      {/* The Time / Status Text Overlay */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
        {isReady ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.6 }}
            style={{ color: 'white', fontWeight: 900, fontSize: '18px', letterSpacing: '0.1em', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            READY
          </motion.div>
        ) : (
          <div style={{ 
            color: 'white', 
            fontWeight: 800, 
            fontSize: '28px', 
            fontFamily: 'var(--ck-font-serif)',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            lineHeight: 1
          }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        )}
        
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          {isReady ? 'Grab it' : 'Cooking'}
        </div>
      </div>
    </div>
  );
}