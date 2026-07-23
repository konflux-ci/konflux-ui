import React from 'react';
import { useEventListener } from '../hooks/useEventListener';
import { createKeyedJSONStorage } from '../utils/storage';
import {
  THEME_SYSTEM,
  THEME_DARK,
  THEME_LIGHT,
  CONTRAST_SYSTEM,
  CONTRAST_DEFAULT,
  CONTRAST_HIGH,
  PREFERS_COLOR_SCHEME_DARK,
  PREFERS_CONTRAST_MORE,
  FORCED_COLORS_ACTIVE,
  CONTRAST_PREFERENCES,
  THEME_PREFERENCES,
} from './const';
import { ContrastMode, ContrastPreference, Theme, ThemePreference } from './types';

export type ThemeContextValue = {
  preference: ThemePreference;
  contrastPreference: ContrastPreference;
  effectiveTheme: Theme;
  effectiveContrast: ContrastMode;
  systemPreference: Theme;
  setThemePreference: (newPreference: ThemePreference) => void;
  setContrastPreference: (newPreference: ContrastPreference) => void;
};

const THEME_STORAGE_KEY = 'konflux-theme-preference';
const CONTRAST_STORAGE_KEY = 'konflux-contrast-preference';

const themeStorage = createKeyedJSONStorage<ThemePreference>(THEME_STORAGE_KEY);
const contrastStorage = createKeyedJSONStorage<ContrastPreference>(CONTRAST_STORAGE_KEY);

export const ThemeContext = React.createContext<ThemeContextValue>({
  preference: 'system',
  contrastPreference: 'system',
  effectiveTheme: 'light',
  effectiveContrast: 'default',
  systemPreference: 'light',
  setThemePreference: () => {},
  setContrastPreference: () => {},
});

const DARK_THEME_CLASS = 'pf-v6-theme-dark';
const HIGH_CONTRAST_CLASS = 'pf-v6-theme-high-contrast';

const getSystemPreference = (): Theme => {
  return window.matchMedia(PREFERS_COLOR_SCHEME_DARK).matches ? THEME_DARK : THEME_LIGHT;
};

const getSystemContrastPreference = (): boolean => {
  return (
    window.matchMedia(PREFERS_CONTRAST_MORE).matches ||
    window.matchMedia(FORCED_COLORS_ACTIVE).matches
  );
};

const getStoredPreference = (): ThemePreference => {
  const stored = themeStorage.get();
  if (stored && THEME_PREFERENCES.includes(stored)) {
    return stored;
  }
  return THEME_SYSTEM;
};

const getStoredContrastPreference = (): ContrastPreference => {
  const stored = contrastStorage.get();
  if (stored && CONTRAST_PREFERENCES.includes(stored)) {
    return stored;
  }
  return CONTRAST_SYSTEM;
};

const applyTheme = (theme: Theme) => {
  const htmlElement = document.documentElement;
  if (theme === THEME_DARK) {
    htmlElement.classList.add(DARK_THEME_CLASS);
  } else {
    htmlElement.classList.remove(DARK_THEME_CLASS);
  }
};

const applyContrast = (contrast: ContrastMode) => {
  const htmlElement = document.documentElement;
  if (contrast === CONTRAST_HIGH) {
    htmlElement.classList.add(HIGH_CONTRAST_CLASS);
  } else {
    htmlElement.classList.remove(HIGH_CONTRAST_CLASS);
  }
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [preference, setPreference] = React.useState<ThemePreference>(getStoredPreference);
  const [contrastPreference, setContrastPrefState] = React.useState<ContrastPreference>(
    getStoredContrastPreference,
  );
  const [systemPreference, setSystemPreference] = React.useState<Theme>(getSystemPreference);
  const [systemWantsHighContrast, setSystemWantsHighContrast] = React.useState<boolean>(
    getSystemContrastPreference,
  );

  // Calculate effective values
  const effectiveTheme = preference === THEME_SYSTEM ? systemPreference : preference;
  const effectiveContrast: ContrastMode =
    contrastPreference === CONTRAST_SYSTEM
      ? systemWantsHighContrast
        ? CONTRAST_HIGH
        : CONTRAST_DEFAULT
      : contrastPreference;

  React.useLayoutEffect(() => {
    applyTheme(effectiveTheme);
  }, [effectiveTheme]);

  React.useLayoutEffect(() => {
    applyContrast(effectiveContrast);
  }, [effectiveContrast]);

  // Listen for system color scheme changes
  useEventListener(
    'change',
    (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? THEME_DARK : THEME_LIGHT);
    },
    window.matchMedia(PREFERS_COLOR_SCHEME_DARK),
  );

  // Listen for system contrast preference changes
  useEventListener(
    'change',
    (e: MediaQueryListEvent) => {
      setSystemWantsHighContrast(e.matches);
    },
    window.matchMedia(PREFERS_CONTRAST_MORE),
  );

  useEventListener(
    'change',
    (e: MediaQueryListEvent) => {
      if (e.matches) {
        setSystemWantsHighContrast(true);
      }
    },
    window.matchMedia(FORCED_COLORS_ACTIVE),
  );

  const setThemePreference = (newPreference: ThemePreference) => {
    setPreference(newPreference);
    themeStorage.set(newPreference);
  };

  const setContrastPreference = (newPreference: ContrastPreference) => {
    setContrastPrefState(newPreference);
    contrastStorage.set(newPreference);
  };

  return (
    <ThemeContext.Provider
      value={{
        preference,
        contrastPreference,
        effectiveTheme,
        effectiveContrast,
        systemPreference,
        setThemePreference,
        setContrastPreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
