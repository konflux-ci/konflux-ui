export const pageHeaderPO = {
  themeDropdownToggle: '[data-test="theme-dropdown-toggle"]',
  themeDropdown: '[data-test="theme-dropdown"]',
  themeOption: (theme: string) => `[data-test="theme-${theme}"]`,
  themeOptionButton: (theme: string) => `[data-test="theme-${theme}"] button`,
  htmlTheme: 'html.konflux-ui__theme',
  contrastOption: (contrast: string) => `[data-test="contrast-${contrast}"]`,
  contrastOptionButton: (contrast: string) => `[data-test="contrast-${contrast}"] button`,
  selected: 'pf-m-selected',
};
