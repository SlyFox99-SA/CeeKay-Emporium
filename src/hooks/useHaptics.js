export function useHaptics() {
  const vibrate = (pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  return {
    light: () => vibrate(10),          // Small tick (e.g., adding to cart)
    medium: () => vibrate(30),         // A bit stronger (e.g., opening modal)
    success: () => vibrate([20, 50, 20]), // Double pulse (e.g., order placed)
    error: () => vibrate([50, 50, 50, 50, 50]), // Buzz (e.g., invalid input)
  };
}