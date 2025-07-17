// Theme preference constants
export const THEME_SYSTEM = 'system';
export const THEME_DARK = 'dark';
export const THEME_LIGHT = 'light';

// Media query constant
export const PREFERS_COLOR_SCHEME_DARK = '(prefers-color-scheme: dark)';

// Theme preferences array for validation
export const THEME_PREFERENCES = [THEME_SYSTEM, THEME_DARK, THEME_LIGHT] as const;

export const THEME_LABELS = {
  [THEME_SYSTEM]: 'Auto',
  [THEME_DARK]: 'Dark',
  [THEME_LIGHT]: 'Light',
} as const;
