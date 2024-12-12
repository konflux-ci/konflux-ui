import { Common } from '../../utils/Common';
import { Login } from '../../utils/Login';

before(() => {
  //Clear namespace before running the tests
  Common.cleanNamespace();

  const url = new URL(Cypress.env('KONFLUX_BASE_URL'));
  cy.setCookie('notice_gdpr_prefs', '0,1,2:', { domain: url.hostname });
  cy.setCookie('cmapi_cookie_privacy', 'permit 1,2,3', { domain: url.hostname });
  cy.setCookie('notice_preferences', '2:', { domain: url.hostname });

  // set local storage to avoid getting started modal
  localStorage.setItem(
    'getting-started-modal',
    JSON.stringify({ 'application-list-getting-started-modal': true }),
  );

  if (Cypress.env('PR_CHECK') || Cypress.env('PERIODIC_RUN')) {
    Login.prCheckLogin();
  } else {
    Login.login();
  }
});

after(() => {
  //Clear namespace after running the tests
  Common.cleanNamespace();
});
