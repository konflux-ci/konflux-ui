import { NavItem, pageTitles } from '../support/constants/PageTitle';
import { userAccessPO } from '../support/pageObjects/userAccess-po';
import { issuesPagePO, secretsPagePO } from '../support/pageObjects/pages-po';
import { ContrastSwitcher, Contrasts, ThemeSwitcher, Themes } from '../support/pages/PageHeader';
import { SecretsPage } from '../support/pages/SecretsPage';
import { UserAccessPage } from '../support/pages/UserAccessPage';
import { Common } from '../utils/Common';
import { Features } from '../utils/Features';

describe('Basic Happy Path', () => {
  // Track if any test has failed - used to skip deletion on failure
  let hasTestFailed = false;

  before(function () {
    if (Cypress.env('STUDIO_MODE')) {
      const baseUrl = Cypress.env('KONFLUX_BASE_URL') as string;

      // Studio replays in isolation — cache SSO cookies so replay skips the login redirect.
      cy.session(
        'konflux-sso',
        () => {
          cy.visit(baseUrl);
          cy.get('[id="page-sidebar"]', { timeout: 300000 }).should('be.visible');
        },
        {
          validate() {
            cy.request({ url: `${baseUrl}/oauth2/userinfo`, failOnStatusCode: false })
              .its('status')
              .should('eq', 200);
          },
        },
      );

      cy.visit(baseUrl);
      return;
    }
    Features.resetToDefault();
  });

  let networkLogs: {
    method: string;
    url: string;
    headers: Record<string, string | string[]>;
    timestamp: number;
    status?: number;
    statusText?: string;
    responseHeaders?: Record<string, string | string[]>;
  }[] = [];

  beforeEach(() => {
    networkLogs = [];

    // Capture every request/response that goes through Cypress's network proxy
    // (Images, CSS, JS, XHR, Fetch, Docs) using cy.intercept instead of raw CDP
    // events, since Cypress.automation('remote:debugger:protocol', ...) only
    // forwards CDP *commands* and has no support for subscribing to CDP *events*
    // such as 'Network.onRequestWillBeSent'.
    cy.intercept('**/*', (req) => {
      const timestamp = Date.now();
      req.continue((res) => {
        networkLogs.push({
          method: req.method,
          url: req.url,
          headers: req.headers,
          timestamp,
          status: res.statusCode,
          statusText: res.statusMessage,
          responseHeaders: res.headers,
        });
      });
    });
  });

  afterEach(function () {
    // Extract and inspect the full network log in afterEach()
    cy.then(() => {
      if (this.currentTest?.state === 'failed') {
        hasTestFailed = true;

        cy.log(`Captured total network events: ${networkLogs.length}`);

        // Save complete traffic to a file
        const safeTestName = Cypress.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_');
        cy.writeFile(`cypress/network-logs/nl-${safeTestName}.json`, networkLogs);
      }
    });
  });

  describe('Check Secrets Page', () => {
    const secretName = 'testing-secret-e2e-flow';
    const secretKey = 'mykey';
    const secretValue = 'myvalue';

    after(() => {
      // Delete secret
      SecretsPage.deleteSecret(secretName);
      // Search secret in a filter field, it should not be listed
      SecretsPage.searchSecret(secretName, false);
    });

    it('Add, Verify and Delete a secret', () => {
      cy.log('Navigate to Secrets page from the sidebar');
      Common.navigateTo(NavItem.secrets);
      Common.waitForLoad();
      cy.get(secretsPagePO.page).contains(secretsPagePO.pageDescription).should('exist');
      cy.get(secretsPagePO.secretsTab).should('exist');

      Common.waitForLoad();

      SecretsPage.addSecret(secretName, secretKey, secretValue);

      // Search secret in a filter field
      SecretsPage.searchSecret(secretName, true);
      // Verify secret values, no edition is done
      SecretsPage.checkValues(secretName, secretKey, secretValue);
    });
  });

  describe('Check Issues page', () => {
    it('Navigate to Issues page from the sidebar', () => {
      Common.navigateTo(NavItem.issues);
      Common.waitForLoad();

      if (!Cypress.env('LOCAL_CLUSTER')) {
        cy.get(issuesPagePO.page).contains(issuesPagePO.pageDescription).should('exist');
        cy.get(issuesPagePO.overviewTab).should('exist');
        cy.get(issuesPagePO.issuesTab).should('exist');
      } else {
        cy.get(issuesPagePO.serviceUnavailableState).should('exist');
        cy.contains(issuesPagePO.serviceUnavailableTitle).should('exist');
      }
    });
  });

  describe('User Access flow', () => {
    const username = `e2euser-${new Date().getTime()}`;
    const grantedRole = 'Contributor';
    const changedRole = 'Maintainer';

    after(() => {
      UserAccessPage.revokeAccess(username);

      cy.log('Verify the user was removed from the list');
      cy.contains(userAccessPO.listTableRow, username).should('not.exist');
    });

    it('Grant, change, and revoke user access', () => {
      cy.log('Navigate to the User Access page from the left navigation');
      Common.navigateTo(NavItem.userAcces);
      cy.url().should('match', /\/ns\/.+\/access$/);
      Common.verifyPageTitle('User access');
      cy.testA11y('User access page');

      UserAccessPage.grantAccess(username, grantedRole);
      cy.url().should('match', /\/ns\/.+\/access$/);

      UserAccessPage.verifyUserInTable(username, grantedRole);

      UserAccessPage.changeAccessRole(username, changedRole);

      UserAccessPage.verifyUserInTable(username, changedRole);
    });
  });

  describe('Check Page Header', () => {
    it('Check Theme Switcher', () => {
      // Checking Theme Switcher
      ThemeSwitcher.clickThemeSwitcher();
      ThemeSwitcher.switchTheme(Themes.SYSTEM, Themes.LIGHT);
      ThemeSwitcher.switchTheme(Themes.LIGHT, Themes.DARK);

      // Checking Contrast Switcher
      ContrastSwitcher.switchContrast(Contrasts.SYSTEM, Contrasts.DEFAULT);
      ContrastSwitcher.switchContrast(Contrasts.DEFAULT, Contrasts.HIGH);
    });
  });
});
