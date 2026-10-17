import { createContext, useContext, useEffect, useState } from 'react';

const PrefsContext = createContext(null);
const KEY = 'ceekay-prefs';

const DEFAULTS = {
  sound: false,      /* off by default — least likely to annoy */
  confetti: true,    /* on by default — it's the reward */
  animations: true,  /* respects OS reduce-motion too */
};

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }, [prefs]);

  const setPref = (key, value) =>
    setPrefs(prev => ({ ...prev, [key]: value }));

  return (
    <PrefsContext.Provider value={{ prefs, setPref }}>
      {children}
    </PrefsContext.Provider>
  );
}

export const usePrefs = () => useContext(PrefsContext);
