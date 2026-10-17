
export function useHaptics() {
  const vibrate = (pattern) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // Silently ignore browser intervention errors
    }
  };

  return {
    light: () => vibrate(10),
    medium: () => vibrate(30),
    success: () => vibrate([20, 50, 20]),
    error: () => vibrate([50, 50, 50, 50, 50]),
  };
}
