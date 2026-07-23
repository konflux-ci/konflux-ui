/**
 * Helpers for the virtualized foldable log viewer.
 * Completed steps start folded, so their content is not in the DOM until expanded.
 */

const COLLAPSED_FOLD_HEADER = '[data-test^="fold-header-"][aria-expanded="false"]';
const LOG_TEXT = '.pf-v6-c-log-viewer__text';

const textMatches = (haystack: string, logText: string | RegExp): boolean =>
  typeof logText === 'string' ? haystack.includes(logText) : logText.test(haystack);

export class LogViewerHelper {
  /**
   * Expand collapsed step headers only until the target text is visible.
   * Avoids expand-all (slow / timeout-prone with virtualized lists).
   */
  static expandUntilLogTextFound(logText: string | RegExp, maxPasses: number = 20) {
    const expandNext = (pass: number) => {
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
        cy.wrap(collapsed[0])
          .scrollIntoView()
          .click({ force: true })
          .then(() => expandNext(pass + 1));
      });
    };
    expandNext(0);
  }
}
