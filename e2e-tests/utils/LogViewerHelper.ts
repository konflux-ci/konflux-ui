import { logViewerPO } from '../support/pageObjects/logViewer-po';

/**
 * Helpers for the virtualized foldable log viewer.
 *
 * Completed steps start folded. Callers must pass `foldStep` for the section that
 * contains the expected text so we expand only that step.
 * PatternFly LogViewerSearch only re-runs on input change — wait until fold headers
 * exist (logs loaded) before typing a query.
 */

const foldHeaderTestId = (foldStep: string) => `fold-header-${foldStep}`;

export class LogViewerHelper {
  static waitForFoldedSteps(timeout: number = 40000) {
    cy.get(logViewerPO.viewer, { timeout }).should('be.visible');
    cy.get(logViewerPO.foldHeader, { timeout }).should('have.length.at.least', 1);
  }

  /**
   * Expand `foldStep`, optionally search, and assert `logText` is visible.
   * When `assertInitiallyFolded`, also checks no section is expanded before revealing.
   * Defaults to the Cypress `defaultCommandTimeout` (40s).
   */
  static revealLogText(
    logText: string | RegExp,
    options: { foldStep: string; timeout?: number; assertInitiallyFolded?: boolean },
  ) {
    const waitTimeout = options.timeout ?? 40000;
    this.waitForFoldedSteps(waitTimeout);
    if (options.assertInitiallyFolded) {
      cy.get(logViewerPO.expandedFoldHeader).should('not.exist');
    }

    this.expandStep(options.foldStep);

    if (typeof logText === 'string') {
      cy.get(logViewerPO.searchInput, { timeout: waitTimeout }).should('be.visible');
      cy.get(logViewerPO.searchInput).clear();
      cy.get(logViewerPO.searchInput).type(logText, { delay: 0 });
    }

    cy.contains(logViewerPO.logText, logText, { timeout: waitTimeout }).scrollIntoView();
    cy.contains(logViewerPO.logText, logText).should('be.visible');
  }

  /** Expand a folded log step by section name (matches `data-test="fold-header-<foldStep>"`). */
  static expandStep(foldStep: string) {
    const testId = foldHeaderTestId(foldStep);
    cy.get(`[data-test="${testId}"][aria-expanded="false"]`)
      .scrollIntoView()
      .should('be.visible')
      .click();
    cy.get(`[data-test="${testId}"]`).should('have.attr', 'aria-expanded', 'true');
  }
}
