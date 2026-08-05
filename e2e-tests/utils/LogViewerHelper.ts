import { logViewerPO } from '../support/pageObjects/logViewer-po';

/**
 * Helpers for the virtualized foldable log viewer.
 *
 * Search expands the folded step that contains the first match, so callers only
 * need to type a query — no manual step expansion.
 * PatternFly LogViewerSearch only re-runs on input change — wait until fold headers
 * exist (logs loaded) before typing a query.
 */

export class LogViewerHelper {
  static waitForFoldedSteps(timeout: number = 40000) {
    cy.get(logViewerPO.viewer, { timeout }).should('be.visible');
    cy.get(logViewerPO.foldHeader, { timeout }).should('have.length.at.least', 1);
  }

  /**
   * Wait for the post-task-selection fetch cycle: spinner appears, then clears.
   * Call after clicking a task/pod in the log sidebar.
   */
  static waitForLogFetch(timeout: number = 20000) {
    cy.get(logViewerPO.loadingSpinner, { timeout }).should('be.visible');
    cy.get(logViewerPO.loadingSpinner, { timeout }).should('not.exist');
  }

  /** Wait until any in-flight log fetch spinner is gone. */
  static waitForLogsLoaded(timeout: number = 20000) {
    cy.get(logViewerPO.loadingSpinner, { timeout }).should('not.exist');
  }

  /**
   * Search for `logText` (which expands the matching folded step) and assert it is visible.
   * When `assertInitiallyFolded`, also checks no section is expanded before searching.
   * Defaults to the Cypress `defaultCommandTimeout` (40s).
   */
  static revealLogText(
    logText: string | RegExp,
    options: { timeout?: number; assertInitiallyFolded?: boolean } = {},
  ) {
    const waitTimeout = options.timeout ?? 40000;
    this.waitForFoldedSteps(waitTimeout);
    this.waitForLogsLoaded(waitTimeout);
    if (options.assertInitiallyFolded) {
      cy.get(logViewerPO.expandedFoldHeader).should('not.exist');
    }

    const searchTerm = typeof logText === 'string' ? logText : logText.source;
    cy.get(logViewerPO.searchInput, { timeout: waitTimeout }).should('be.visible');
    cy.get(logViewerPO.searchInput).clear();
    cy.get(logViewerPO.searchInput).type(searchTerm);

    cy.contains(logViewerPO.logText, logText, { timeout: waitTimeout }).scrollIntoView();
    cy.contains(logViewerPO.logText, logText).should('be.visible');
  }
}
