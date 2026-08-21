// Include the cypress customized commands related files
import './hooks';
import './a11y';
import { Result } from 'axe-core';
import { registerRunPlugins } from './registerRunPlugins';

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
Cypress.on('uncaught:exception', () => {
  return false;
});

// Plugins that hook command:start/end break Cypress Studio recording.
if (!Cypress.env('SKIP_GLOBAL_SETUP')) {
  registerRunPlugins();
}
