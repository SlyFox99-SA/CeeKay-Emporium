import { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext(null);
const STORAGE_KEY = 'ceekay-prefs';

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { sound: true, confetti: true, animations: true };
    } catch {
      return { sound: true, confetti: true, animations: true };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const togglePref = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <PreferencesContext.Provider value={{ prefs, togglePref }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePrefs = () => useContext(PreferencesContext);