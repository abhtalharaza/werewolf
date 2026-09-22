import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'night' | 'day';

interface ThemeContextType {
  isNightMode: boolean;
  theme: ThemeMode;
  toggleNightMode: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'werewolf_social_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'night' || saved === 'day') {
        return saved;
      }
      // Check system preference if no explicit selection
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'night';
      }
    }
    return 'day';
  });

  useEffect(() => {
    const root = document.documentElement;
    const appRoot = document.getElementById('werewolf-app-root');

    if (theme === 'night') {
      root.classList.add('dark', 'night-mode');
      appRoot?.classList.add('dark', 'night-mode');
    } else {
      root.classList.remove('dark', 'night-mode');
      appRoot?.classList.remove('dark', 'night-mode');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const toggleNightMode = () => {
    setThemeState((prev) => (prev === 'night' ? 'day' : 'night'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        isNightMode: theme === 'night',
        theme,
        toggleNightMode,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useNightMode = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useNightMode must be used within a ThemeProvider');
  }
  return context;
};
