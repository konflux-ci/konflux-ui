import React from 'react';
import { useEventListener } from '../hooks/useEventListener';
import {
  THEME_SYSTEM,
  THEME_DARK,
  THEME_LIGHT,
  PREFERS_COLOR_SCHEME_DARK,
  THEME_PREFERENCES,
} from './const';
import { Theme, ThemePreference } from './types';

export type ThemeContextValue = {
  preference: ThemePreference;
  effectiveTheme: Theme;
  systemPreference: Theme;
  logTheme: Theme;
  setLogTheme: (newLogTheme: Theme) => void;
  setThemePreference: (newPreference: ThemePreference) => void;
};

export const ThemeContext = React.createContext<ThemeContextValue>({
  preference: 'system',
  effectiveTheme: 'light',
  systemPreference: 'light',
  logTheme: 'dark',
  setLogTheme: () => {},
  setThemePreference: () => {},
});

const THEME_STORAGE_KEY = 'konflux-theme-preference';
const LOG_THEME_STORAGE_KEY = 'konflux-logs-theme-preference';
const DARK_THEME_CLASS = 'pf-v5-theme-dark';

const getSystemPreference = (): Theme => {
  return window.matchMedia(PREFERS_COLOR_SCHEME_DARK).matches ? THEME_DARK : THEME_LIGHT;
};

const getStoredPreference = (): ThemePreference => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && THEME_PREFERENCES.includes(stored as ThemePreference)) {
    return stored as ThemePreference;
  }
  return THEME_SYSTEM;
};

const getStoredLogTheme = (): Theme => {
  const stored = localStorage.getItem(LOG_THEME_STORAGE_KEY);
  if (stored && THEME_PREFERENCES.includes(stored as Theme)) {
    return stored as Theme;
  }
  return THEME_DARK;
};

const applyTheme = (theme: Theme) => {
  const htmlElement = document.documentElement;
  if (theme === THEME_DARK) {
    htmlElement.classList.add(DARK_THEME_CLASS);
  } else {
    htmlElement.classList.remove(DARK_THEME_CLASS);
  }
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [preference, setPreference] = React.useState<ThemePreference>(getStoredPreference);
  const [systemPreference, setSystemPreference] = React.useState<Theme>(getSystemPreference);
  const [logTheme, setLogTheme] = React.useState<Theme>(getStoredLogTheme);

  // Calculate the effective theme based on preference
  const effectiveTheme = preference === THEME_SYSTEM ? systemPreference : preference;

  React.useLayoutEffect(() => {
    applyTheme(effectiveTheme);
  }, [effectiveTheme]);

  useEventListener(
    'change',
    (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? THEME_DARK : THEME_LIGHT);
    },
    window.matchMedia(PREFERS_COLOR_SCHEME_DARK),
  );

  const setThemePreference = (newPreference: ThemePreference) => {
    setPreference(newPreference);
    localStorage.setItem(THEME_STORAGE_KEY, newPreference);
  };

  const handleSetLogTheme = (newLogTheme: Theme) => {
    setLogTheme(newLogTheme);
    localStorage.setItem(LOG_THEME_STORAGE_KEY, newLogTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        preference,
        effectiveTheme,
        systemPreference,
        logTheme,
        setLogTheme: handleSetLogTheme,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
