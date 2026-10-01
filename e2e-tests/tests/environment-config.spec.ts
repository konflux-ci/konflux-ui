import { NavItem } from '../support/constants/PageTitle';
import { userAccessPO } from '../support/pageObjects/userAccess-po';
import { issuesPagePO, secretsPagePO } from '../support/pageObjects/pages-po';
import { ContrastSwitcher, Contrasts, ThemeSwitcher, Themes } from '../support/pages/PageHeader';
import { SecretsPage } from '../support/pages/SecretsPage';
import { UserAccessPage } from '../support/pages/UserAccessPage';
import { Common } from '../utils/Common';
import { Features } from '../utils/Features';

// Matches header/query-param names that may carry credentials so captured
// network logs never leak them into failure artifacts (files written via
// cy.writeFile, which may be uploaded as CI artifacts).
const SENSITIVE_KEY_PATTERN =
  /(authoriz|cookie|token|secret|password|pwd|session|credential|api[-_]?key)/i;

// Headers whose *value* is itself a URL that may embed credentials (e.g.
// basic-auth userinfo or a sensitive query param), even though the header
// name itself doesn't look sensitive.
const URL_VALUED_HEADER_PATTERN = /^(referer|referrer|location)$/i;

const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Strip any basic-auth credentials embedded in the URL (e.g.
    // https://user:pass@host/...).
    if (parsed.username || parsed.password) {
      parsed.username = '';
      parsed.password = '';
    }
    parsed.searchParams.forEach((_value, key) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    });
    return parsed.toString();
  } catch {
    // Fallback for URLs the WHATWG parser rejects: drop the query string
    // entirely rather than risk leaking sensitive params.
    const [path] = url.split('?');
    return url.includes('?') ? `${path}?[REDACTED]` : path;
  }
};

const sanitizeHeaderValue = (key: string, value: string | string[]): string | string[] => {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }
  if (URL_VALUED_HEADER_PATTERN.test(key)) {
    return Array.isArray(value) ? value.map(sanitizeUrl) : sanitizeUrl(value);
  }
  return value;
};

const sanitizeHeaders = (
  headers: Record<string, string | string[]>,
): Record<string, string | string[]> =>
  Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, sanitizeHeaderValue(key, value)]),
  );

type NetworkLogEntry = {
  method: string;
  url: string;
  headers: Record<string, string | string[]>;
  timestamp: number;
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string | string[]>;
};

// Capture every request/response that goes through Cypress's network proxy
// (Images, CSS, JS, XHR, Fetch, Docs) using cy.intercept instead of raw CDP
// events, since Cypress.automation('remote:debugger:protocol', ...) only
// forwards CDP *commands* and has no support for subscribing to CDP *events*
// such as 'Network.onRequestWillBeSent'.
const captureNetworkTraffic = (
  logs: NetworkLogEntry[],
  // Lets callers stop recording into `logs` once they're done with it
  // (e.g. once a setup phase has completed), without having to tear down
  // the underlying intercept, which stays registered for the rest of the spec.
  shouldCapture: () => boolean = () => true,
) => {
  cy.intercept('**/*', (req) => {
    const timestamp = Date.now();
    req.continue((res) => {
      if (!shouldCapture()) {
        return;
      }
      logs.push({
        method: req.method,
        url: sanitizeUrl(req.url),
        headers: sanitizeHeaders(req.headers),
        timestamp,
        status: res.statusCode,
        statusText: res.statusMessage,
        responseHeaders: sanitizeHeaders(res.headers),
      });
    });
  });
};

describe('Environment Configuration Tests', () => {
  // Setup-phase capture buffer, separate from the per-test `networkLogs`
  // captured in beforeEach below: a `before` hook failure has no
  // `this.currentTest`, so the afterEach failure handler can't pick it up.
  // `setupFailed` is flipped by the `cy.on('fail', ...)` listener in
  // `before()`, which is deregistered once setup finishes so it can't catch
  // later test failures; the actual file write happens in `after()` below,
  // since that hook still runs even when `before()` fails, whereas writing
  // from inside the failure listener itself would race the hook teardown.
  let setupNetworkLogs: NetworkLogEntry[] = [];
  let setupFailed = false;

  before(function () {
    // Start capturing before any setup action (Studio session login,
    // cy.visit, Features.resetToDefault) runs.
    setupNetworkLogs = [];
    setupFailed = false;
    // Guards both the `fail` listener below and the network capture against
    // firing for anything beyond this `before()` hook: `cy.on('fail', ...)`
    // and the `cy.intercept(...)` registered via `captureNetworkTraffic`
    // both stay active for the entire spec (not just this hook), so without
    // this flag a later test's failure/traffic would be wrongly attributed
    // to setup.
    let setupInProgress = true;
    captureNetworkTraffic(setupNetworkLogs, () => setupInProgress);

    const handleSetupFailure = (error: Error) => {
      setupFailed = true;
      throw error;
    };
    cy.on('fail', handleSetupFailure);

    if (Cypress.expose('STUDIO_MODE')) {
      const baseUrl = Cypress.expose('KONFLUX_BASE_URL') as string;

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
    } else {
      Features.resetToDefault();
    }

    // Runs after all the setup commands above have executed. If `before()`
    // fails partway through, this never runs — which is fine, since a failed
    // `before()` hook skips the rest of the suite anyway, so there's no
    // later test traffic/failure for the stale listener or intercept to
    // misattribute.
    cy.then(() => {
      setupInProgress = false;
      cy.off('fail', handleSetupFailure);
    });
  });

  after(() => {
    if (setupFailed) {
      cy.writeFile('cypress/network-logs/nl-before_all_setup.json', setupNetworkLogs);
    }
  });

  let networkLogs: NetworkLogEntry[] = [];

  beforeEach(() => {
    networkLogs = [];
    captureNetworkTraffic(networkLogs);
  });

  afterEach(function () {
    // Extract and inspect the full network log in afterEach()
    cy.then(() => {
      if (this.currentTest?.state === 'failed') {
        cy.log(`Captured total network events: ${networkLogs.length}`);

        // Save complete traffic to a file
        const safeTestName = this.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_');
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

      if (!Cypress.expose('LOCAL_CLUSTER')) {
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
