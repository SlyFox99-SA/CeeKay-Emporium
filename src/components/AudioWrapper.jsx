import { useEffect } from 'react';
import { primeAudio } from '../lib/chime';

export default function AudioWrapper({ children }) {
  useEffect(() => {
    const unlock = () => {
      primeAudio();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return <>{children}</>;
}