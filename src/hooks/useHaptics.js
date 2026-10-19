export function useHaptics() {
  const vibrate = (pattern) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (!navigator.userActivation || navigator.userActivation.hasBeenActive) {
          navigator.vibrate(pattern);
        }
      }
    } catch (e) {
      // Silently ignore
    }
  };

  return {
    light: () => vibrate(10),
    medium: () => vibrate(30),
    heavy: () => vibrate(60), // FIXED: Added heavy haptic
    success: () => vibrate([20, 50, 20]),
    error: () => vibrate([50, 50, 50, 50, 50]),
  };
}