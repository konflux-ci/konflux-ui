// Include the cypress customized commands related files
import addContext from 'mochawesome/addContext';
import './hooks';
import './a11y';
import 'cypress-mochawesome-reporter/register';
import { Result } from 'axe-core';
import { initPerfMeasuring } from './perf';
import { now } from 'cypress/types/lodash';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      logA11yViolations(violations: Result[], target: string): Chainable<Element>;
      testA11y(target: string, selector?: string): Chainable<Element>;
      perfGroupStart(groupName: string): void;
      perfGroupEnd(groupName: string): void;
    }
  }
}

// Handling errors from application
// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
Cypress.on('uncaught:exception', (err) => {
  return false;
});

Cypress.on('test:after:run', (test, runnable) => {
  if (test.state === 'failed') {
    cy.window().then((win) => {
      cy.log('Capturing DOM structure');
      // Capture DOM structure
      const domContent = win.document.documentElement.outerHTML;
      // Saving timestamp as unique name itentifier
      const timestamp = now.toString().replace(/[:.]/g, '-');

      // Construct the filename (replace '/assets/saved-doms' if needed )
      const domFileName = `${runnable.parent.title} -- ${test.title} (failed) -- ${timestamp}.html`;
      cy.writeFile(
        `./assets/saved-doms/${domFileName}`,
        domContent.length > 10000 ? domContent.substring(0, 10000) + '...' : domContent,
      );

      // Add the context to the report
      addContext(
        { test },
        {
          title: 'Failed DOM Structure (Snippet)',
          value: `./assets/saved-doms/${domFileName}`,
        },
      );
    });
  }
});

// Add browser logs collector
const logOptions = {
  enableExtendedCollector: true,
};
require('cypress-terminal-report/src/installLogsCollector')(logOptions);
initPerfMeasuring('cypress/perfstats.json');
