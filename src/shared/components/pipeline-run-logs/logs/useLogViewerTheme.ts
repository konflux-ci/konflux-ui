import { useEffect, useRef } from 'react';
import { THEME_DARK, THEME_LIGHT, useTheme } from '~/shared/theme';
import type { Theme } from '~/shared/theme/types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const LOG_THEME_STORAGE_KEY = 'konflux-logs-theme-preference';

const getStoredLogTheme = (): Theme => {
  const stored = localStorage.getItem(LOG_THEME_STORAGE_KEY);
  if (stored === THEME_DARK || stored === THEME_LIGHT) {
    return stored as Theme;
  }
  return THEME_DARK;
};

type UseLogViewerThemeResult = [Theme, (newLogTheme: Theme) => void];

export const useLogViewerTheme = (): UseLogViewerThemeResult => {
  const { effectiveTheme } = useTheme();
  const [logTheme, setLogTheme] = useLocalStorage<Theme>(
    LOG_THEME_STORAGE_KEY,
    getStoredLogTheme(),
  );

  const prevEffectiveThemeRef = useRef(effectiveTheme);

  useEffect(() => {
    if (prevEffectiveThemeRef.current !== effectiveTheme) {
      setLogTheme(effectiveTheme);
      prevEffectiveThemeRef.current = effectiveTheme;
    }
  }, [effectiveTheme, setLogTheme]);

  return [logTheme ?? 'dark', setLogTheme];
};
