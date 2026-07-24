/**
 * Helpers for the virtualized foldable log viewer.
 * Completed steps start folded, so their content is not in the DOM until expanded.
 * Prefer search (expands + scrolls to the match) over clicking every fold header.
 */

const SEARCH_INPUT = '.pf-v6-c-log-viewer input[aria-label="Search input"]';
const SEARCH_RESULTS_BADGE = '.pf-v6-c-log-viewer .pf-v6-c-badge';
const COLLAPSED_FOLD_HEADER = '[data-test^="fold-header-"][aria-expanded="false"]';
const LOG_TEXT = '.pf-v6-c-log-viewer__text';

const textMatches = (haystack: string, logText: string | RegExp): boolean =>
  typeof logText === 'string' ? haystack.includes(logText) : logText.test(haystack);

export class LogViewerHelper {
  /**
   * Use the log viewer search to expand the folded section containing `logText`
   * and scroll that match into the virtualized viewport, then assert it is visible.
   */
  static searchAndReveal(logText: string, timeout: number = 30000) {
    cy.get(SEARCH_INPUT, { timeout }).should('be.visible');
    cy.get(SEARCH_INPUT).clear();
    cy.get(SEARCH_INPUT).type(logText, { delay: 0 });

    // PatternFly SearchInput resultsCount looks like "1 / 3" when matches exist.
    cy.get(SEARCH_RESULTS_BADGE, { timeout }).should(($el) => {
      expect($el.text().trim()).to.match(/^[1-9]\d*\s*\/\s*[1-9]\d*$/);
    });

    cy.contains(LOG_TEXT, logText, { timeout }).scrollIntoView();
    cy.contains(LOG_TEXT, logText).should('be.visible');
  }

  /**
   * Reveal log text for string | RegExp assertions.
   * Strings use search (reliable with folding + virtualization).
   * RegExp falls back to expanding collapsed step headers.
   */
  static revealLogText(logText: string | RegExp, timeout: number = 30000) {
    if (typeof logText === 'string') {
      this.searchAndReveal(logText, timeout);
      return;
    }
    this.expandUntilLogTextFound(logText, timeout);
  }

  /**
   * Expand collapsed step headers only until the target text is in the DOM.
   * Less reliable for huge steps (virtualization); prefer searchAndReveal for strings.
   */
  static expandUntilLogTextFound(logText: string | RegExp, timeout: number = 30000) {
    // Wait until the viewer has rendered fold headers (or the text is already visible).
    cy.get('body', { timeout }).should(($body) => {
      const visible = textMatches($body.find(LOG_TEXT).text(), logText);
      const hasCollapsed = $body.find(COLLAPSED_FOLD_HEADER).length > 0;
      expect(visible || hasCollapsed, 'log text visible or collapsed fold headers present').to.be
        .true;
    });

    const expandNext = (pass: number, maxPasses: number = 20) => {
      if (pass >= maxPasses) {
        return;
      }
      cy.get('body').then(($body) => {
        if (textMatches($body.find(LOG_TEXT).text(), logText)) {
          return;
        }
        const collapsed = $body.find(COLLAPSED_FOLD_HEADER);
        if (collapsed.length === 0) {
          return;
        }
        cy.wrap(collapsed[0]).scrollIntoView();
        cy.wrap(collapsed[0]).click({ force: true });
        expandNext(pass + 1, maxPasses);
      });
    };
    expandNext(0);
  }
}
