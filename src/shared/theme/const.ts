// Theme preference constants
export const THEME_SYSTEM = 'system';
export const THEME_DARK = 'dark';
export const THEME_LIGHT = 'light';

// Contrast preference constants
export const CONTRAST_SYSTEM = 'system';
export const CONTRAST_DEFAULT = 'default';
export const CONTRAST_HIGH = 'high-contrast';

// Media query constants
export const PREFERS_COLOR_SCHEME_DARK = '(prefers-color-scheme: dark)';
export const PREFERS_CONTRAST_MORE = '(prefers-contrast: more)';
export const FORCED_COLORS_ACTIVE = '(forced-colors: active)';

// Validation arrays
export const THEME_PREFERENCES = [THEME_SYSTEM, THEME_DARK, THEME_LIGHT] as const;
export const CONTRAST_PREFERENCES = [CONTRAST_SYSTEM, CONTRAST_DEFAULT, CONTRAST_HIGH] as const;

// Labels
export const THEME_PREFERENCE_LABELS = {
  [THEME_SYSTEM]: 'System',
  [THEME_LIGHT]: 'Light',
  [THEME_DARK]: 'Dark',
} as const;

export const CONTRAST_PREFERENCE_LABELS = {
  [CONTRAST_SYSTEM]: 'System',
  [CONTRAST_DEFAULT]: 'Default',
  [CONTRAST_HIGH]: 'High Contrast',
} as const;
