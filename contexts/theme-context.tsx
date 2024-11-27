'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useHotkeys } from '../hooks/use-hotkeys';
import { useLocalStorage } from 'usehooks-ts';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>(`theme`, 'light');
  useHotkeys('toggle-theme', {
    key: 'cmd+.',
    description: 'Toggle theme',
    scope: 'Global',
    callback: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  });

  useEffect(() => {
    // Update document class and save to localStorage when theme changes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
