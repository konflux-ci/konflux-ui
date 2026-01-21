import { Common } from '../../utils/Common';
import { Login } from '../../utils/Login';

const addContext = require('mochawesome/addContext');

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

  if (Cypress.env('LOCAL_CLUSTER')) {
    Login.localKonfluxLogin();
  } else if (Cypress.env('PERIODIC_RUN_STAGE')) {
    Login.stageKonfluxLogin();
  } else {
    Login.login();
  }

  // Ensure we land on the Konflux UI after login
  Common.openAppStudioBaseURL();
  Common.waitForLoad();
  Common.clickOnConsentButton();
});

afterEach(function () {
  if (this.currentTest?.state === 'failed') {
    cy.window().then((win) => {
      cy.log('Capturing DOM structure');
      // Capture DOM structure
      const domContent = win.document.body.outerHTML;
      // Saving timestamp as unique name itentifier
      const dateNow = new Date();
      const standardDate = `${dateNow.getFullYear()}${(dateNow.getUTCMonth() + 1).toString()}${dateNow.getDate()}`;
      const timestamp = `${standardDate}-${dateNow.getTime()}`;

      // In case of retaining dom structure (replace '/cypress/saved-doms' to a location outside "./cypress" )
      const domFileName = `./cypress/saved-doms/${standardDate}/${timestamp}_${this.currentTest.title}__(${this.currentTest.state}).html`;
      cy.writeFile(domFileName, domContent);
    });
  }
});

after(() => {
  //Clear namespace after running the tests
  Common.cleanNamespace();
});
