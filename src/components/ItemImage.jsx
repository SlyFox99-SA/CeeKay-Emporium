import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ItemImage({ src, alt, className, style }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop";
  const finalSrc = hasError || !src || src.length < 5 ? FALLBACK_IMG : src;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--ck-cream)', ...style }}>
      {/* Skeleton Pulse */}
      {!isLoaded && (
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }} 
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', inset: 0, background: 'var(--ck-border-strong)' }} 
        />
      )}

      <motion.img
        src={finalSrc}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => { setHasError(true); setIsLoaded(true); }}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.05 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}