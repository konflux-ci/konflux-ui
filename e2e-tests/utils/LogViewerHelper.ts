import { logViewerPO } from '../support/pageObjects/logViewer-po';

/**
 * Helpers for the virtualized foldable log viewer.
 *
 * Search expands the folded step that contains the first match, so callers only
 * need to type a query — no manual step expansion.
 * PatternFly LogViewerSearch only re-runs on input change — wait until logs have
 * finished loading before typing, or the query indexes empty/partial content.
 */

export class LogViewerHelper {
  static waitForFoldedSteps(timeout: number = 40000) {
    cy.get(logViewerPO.viewer, { timeout }).should('be.visible');
    cy.get(logViewerPO.foldHeader, { timeout }).should('have.length.at.least', 1);
  }

  /** Wait until the banner spinner is gone so search runs against full log content. */
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

    // Search expands the step that owns the first match before lines enter the DOM.
    cy.get(logViewerPO.expandedFoldHeader, { timeout: waitTimeout }).should('exist');

    cy.contains(logViewerPO.logText, logText, { timeout: waitTimeout })
      .scrollIntoView()
      .should('be.visible');
  }
}
