import common = require('mocha/lib/interfaces/common');
import { NavItem, pageTitles } from '../support/constants/PageTitle';
import {
  localKonfluxLoginPO,
  openshiftLoginPO,
  stageLoginPO,
} from '../support/pageObjects/login-po';
import { GetStartedPage, GetAppStartedPage } from '../support/pages/GetStartedPage';
import { Common } from './Common';
import { goToApplicationsPagePo, namespacesPagePO } from '../support/pageObjects/pages-po';

interface CredentialsEnv {
  USERNAME: string;
  PASSWORD: string;
}

export class Login {
  static login() {
    cy.visit(Cypress.expose('KONFLUX_BASE_URL'));
    // cy.get(stageLoginPO.dex).should('be.visible').click();
    // disabling as we don't have testing account on stage, manual log in is needed
    // cy.get(stageLoginPO.dex).should('be.visible').click();
    // cy.get(stageLoginPO.loginWithSso).click();
    // cy.get(stageLoginPO.username).type(username);
    // cy.get(stageLoginPO.password).type(password, { log: false });
    // cy.get(stageLoginPO.loginButton).click();
    this.waitForApps();
  }

  static localKonfluxLogin(username?: string, password?: string) {
    cy.env(['USERNAME', 'PASSWORD']).then(({ USERNAME, PASSWORD }: CredentialsEnv) => {
      const user = username ?? USERNAME;
      const pass = password ?? PASSWORD;

      console.log('Logging in to local Konflux...');
      cy.visit(Cypress.expose('KONFLUX_BASE_URL'));
      cy.get(localKonfluxLoginPO.dex).should('be.visible').click();
      cy.get(localKonfluxLoginPO.username).type(user);
      cy.get(localKonfluxLoginPO.password).type(pass, { log: false });
      cy.get(localKonfluxLoginPO.loginButton).click();

      // Grant Access appears on some deploys
      cy.get('body', { timeout: 30000 }).then(($body) => {
        if ($body.find(localKonfluxLoginPO.grantAccessClass).length > 0) {
          cy.contains(
            localKonfluxLoginPO.grantAccessClass,
            localKonfluxLoginPO.grantAccessText,
          ).click();
        }
      });

      this.waitForApps();
    });
  }

  static openshiftLogin(username?: string, password?: string) {
    cy.env(['USERNAME', 'PASSWORD']).then(({ USERNAME, PASSWORD }: CredentialsEnv) => {
      const user = username ?? USERNAME;
      const pass = password ?? PASSWORD;

      cy.visit(Cypress.expose('KONFLUX_BASE_URL'));
      // Wait for either the login form (not authenticated) or the app sidebar (already authenticated)
      cy.get(`${openshiftLoginPO.username}, ${openshiftLoginPO.sidebar}`, {
        timeout: 30000,
      }).should('exist');
      cy.get('body').then(($body) => {
        if ($body.find(openshiftLoginPO.username).length > 0) {
          cy.get(openshiftLoginPO.username).type(user);
          cy.get(openshiftLoginPO.password).type(pass, { log: false });
          cy.get(openshiftLoginPO.loginButton).should('be.enabled').click();
          // Click through OAuth consent page if it appears
          cy.get(`${openshiftLoginPO.approveButton}, ${openshiftLoginPO.sidebar}`, {
            timeout: 60000,
          })
            .first()
            .then(($el) => {
              if ($el.is(openshiftLoginPO.approveButton)) {
                cy.wrap($el).click();
              }
            });
          cy.get(openshiftLoginPO.sidebar, { timeout: 60000 }).should('exist');
        }
      });
      this.waitForApps();
    });
  }

  static stageKonfluxLogin(username?: string, password?: string) {
    cy.env(['USERNAME', 'PASSWORD']).then(({ USERNAME, PASSWORD }: CredentialsEnv) => {
      const user = username ?? USERNAME;
      const pass = password ?? PASSWORD;

      console.log('Logging in to stage Konflux...');
      // Capture the unauthenticated userinfo call from the first visit and the
      // successful one after SSO. The alias has to exist before cy.visit.
      cy.intercept('GET', '**/oauth2/userinfo').as('userinfo');
      cy.visit(Cypress.expose('KONFLUX_BASE_URL'));

      // Click through IDP selection page if it appears
      cy.get('body').then(($body) => {
        if ($body.find(stageLoginPO.idpRedHatSsoButton).length > 0) {
          cy.get(stageLoginPO.idpRedHatSsoButton).click();
        }
      });

      cy.get(stageLoginPO.username).type(user);
      cy.get(stageLoginPO.password).type(pass, { log: false });
      cy.get(stageLoginPO.loginButton).click();

      // Click through OAuth consent page if it appears
      cy.get('body', { timeout: 30000 }).then(($body) => {
        if ($body.find(stageLoginPO.approveButton).length > 0) {
          cy.get(stageLoginPO.approveButton).click();
        }
      });

      // The first load requests Kubernetes before the SSO session is usable and
      // stays on the Invalid token page. Reload once userinfo succeeds.
      this.waitForUserinfo(4);
      cy.visit(Cypress.expose('KONFLUX_BASE_URL'));

      this.waitForApps();
    });
  }

  private static waitForUserinfo(attemptsLeft: number) {
    cy.wait('@userinfo', { timeout: 60000 }).then((interception) => {
      if (interception.response?.statusCode === 200) {
        return;
      }
      expect(attemptsLeft, 'authenticated /oauth2/userinfo response').to.be.greaterThan(1);
      Login.waitForUserinfo(attemptsLeft - 1);
    });
  }

  private static waitForApps() {
    Common.waitForLoad();
    // Wait for https://localhost:8080/ loaded
    GetStartedPage.waitForLoad();
    // Go to the https://localhost:8080/ns
    Common.navigateTo(NavItem.namespaces);
    Common.verifyPageTitle(pageTitles.namespaces);
    Common.waitForLoad();
    cy.testA11y(`${pageTitles.namespaces}`);
    // Go to https://localhost:8080/ns/your-tenant/applications
    cy.get(namespacesPagePO.title).should('be.visible');
    cy.get(namespacesPagePO.filterNamespaceInput)
      .clear()
      .type(`${Cypress.expose('HAC_NAMESPACE')}`);
    cy.get(
      goToApplicationsPagePo(`${Cypress.expose('HAC_NAMESPACE')}`).goToApplicationsPagePo,
    ).click();
    Common.waitForLoad();
    GetAppStartedPage.waitForLoad();
    Common.waitForLoad();
    Common.verifyPageTitle(pageTitles.applications);
    cy.testA11y(`${pageTitles.applications}`);
  }
}
