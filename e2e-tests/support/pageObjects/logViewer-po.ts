/** Shared selectors for the virtualized foldable log viewer (modal + drawer). */
export const logViewerPO = {
  viewer: '.pf-v6-c-log-viewer',
  logText: '.pf-v6-c-log-viewer__text',
  searchInput: 'input[name*="logViewerSearchInput"]',
  /** Shown while task/container logs are still being fetched. */
  loadingSpinner: '[aria-label="Loading logs"]',
  foldHeader: '[data-test^="fold-header-"]',
  collapsedFoldHeader: '[data-test^="fold-header-"][aria-expanded="false"]',
  /** Expanded section header (AngleDown / aria-expanded=true). */
  expandedFoldHeader: '[data-test^="fold-header-"][aria-expanded="true"]',
};
