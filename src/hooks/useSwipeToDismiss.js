 
import { useRef } from 'react';

export function useSwipeToDismiss(onDismiss) {
  const startY = useRef(0);
  const currentY = useRef(0);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    // Optional: Add visual drag transform here if desired
  };

  const onTouchEnd = () => {
    const delta = currentY.current - startY.current;
    if (delta > 80) { // If swiped down more than 80px
      onDismiss();
    }
    startY.current = 0;
    currentY.current = 0;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
