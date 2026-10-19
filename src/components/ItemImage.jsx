import { useState } from 'react';
import { motion } from 'framer-motion';
import CKMark from './CKMark';

export default function ItemImage({ src, alt, className, style }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If no image exists, render a premium branded placeholder
  const isMissing = !src || src.length < 5 || hasError;

  if (isMissing) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--ck-cream) 0%, #e8ddc5 100%)', ...style }}>
        <div style={{ opacity: 0.2, transform: 'scale(2)' }}>
          <CKMark size={48} variant="gradient" />
        </div>
      </div>
    );
  }

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
        src={src}
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