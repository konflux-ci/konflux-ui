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
  setThemePreference: (newPreference: ThemePreference) => void;
};

export const ThemeContext = React.createContext<ThemeContextValue>({
  preference: 'system',
  effectiveTheme: 'light',
  systemPreference: 'light',
  setThemePreference: () => {},
});

const THEME_STORAGE_KEY = 'konflux-theme-preference';
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

  return (
    <ThemeContext.Provider
      value={{
        preference,
        effectiveTheme,
        systemPreference,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
