
export function useHaptics() {
  const vibrate = (pattern) => {
    try {
      // Check if the browser supports it AND if the user has interacted yet
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // navigator.userActivation tells us if the user has tapped the screen
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
    success: () => vibrate([20, 50, 20]),
    error: () => vibrate([50, 50, 50, 50, 50]),
  };
}
