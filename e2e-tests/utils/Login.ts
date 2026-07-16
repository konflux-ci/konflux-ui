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

export class Login {
  static login(
    username: string = Cypress.env('USERNAME'),
    password: string = Cypress.env('PASSWORD'),
  ) {
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    // cy.get(stageLoginPO.dex).should('be.visible').click();
    // disabling as we don't have testing account on stage, manual log in is needed
    // cy.get(stageLoginPO.dex).should('be.visible').click();
    // cy.get(stageLoginPO.loginWithSso).click();
    // cy.get(stageLoginPO.username).type(username);
    // cy.get(stageLoginPO.password).type(password, { log: false });
    // cy.get(stageLoginPO.loginButton).click();
    this.waitForApps();
  }

  static localKonfluxLogin(
    username: string = Cypress.env('USERNAME'),
    password: string = Cypress.env('PASSWORD'),
  ) {
    console.log('Logging in to local Konflux...');
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    cy.get(localKonfluxLoginPO.dex).should('be.visible').click();
    cy.get(localKonfluxLoginPO.username).type(username);
    cy.get(localKonfluxLoginPO.password).type(password, { log: false });
    cy.get(localKonfluxLoginPO.loginButton).click();
    this.waitForApps();
  }

  static openshiftLogin(
    username: string = Cypress.env('USERNAME'),
    password: string = Cypress.env('PASSWORD'),
  ) {
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    // Wait for either the login form (not authenticated) or the app sidebar (already authenticated)
    cy.get(`${openshiftLoginPO.username}, ${openshiftLoginPO.sidebar}`, { timeout: 30000 }).should(
      'exist',
    );
    cy.get('body').then(($body) => {
      if ($body.find(openshiftLoginPO.username).length > 0) {
        cy.get(openshiftLoginPO.username).type(username);
        cy.get(openshiftLoginPO.password).type(password, { log: false });
        cy.get(openshiftLoginPO.loginButton).should('be.enabled').click();
        // Click through OAuth consent page if it appears
        cy.get(`${openshiftLoginPO.approveButton}, ${openshiftLoginPO.sidebar}`, { timeout: 60000 })
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
  }

  static stageKonfluxLogin(
    username: string = Cypress.env('USERNAME'),
    password: string = Cypress.env('PASSWORD'),
  ) {
    console.log('Logging in to stage Konflux...');
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    cy.get(stageLoginPO.dex).should('be.visible').click();
    cy.get(stageLoginPO.username).type(username);
    cy.get(stageLoginPO.password).type(password, { log: false });
    cy.get(stageLoginPO.loginButton).click();

    // Click through OAuth consent page if it appears
    cy.get('body', { timeout: 30000 }).then(($body) => {
      if ($body.find(stageLoginPO.approveButton).length > 0) {
        cy.get(stageLoginPO.approveButton).click();
      }
    });
    // Grant Access is always required
    cy.contains(stageLoginPO.grantAccessClass, stageLoginPO.grantAccessText).click();

    // ----- Workaround -----
    // Sometimes page doesn't go to homepage but shows
    // "Something went wrong - Invalid token" message.
    cy.get('body', { timeout: 10000 }).then(($body) => {
      if ($body.text().includes('You have successfully logged into Red Hat Internal SSO')) {
        cy.wait(2000);
        cy.visit(Cypress.env('KONFLUX_BASE_URL'));
      }
    });
    // ----- end of workaround -----

    this.waitForApps();
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
      .type(`${Cypress.env('HAC_NAMESPACE')}`);
    cy.get(
      goToApplicationsPagePo(`${Cypress.env('HAC_NAMESPACE')}`).goToApplicationsPagePo,
    ).click();
    Common.waitForLoad();
    GetAppStartedPage.waitForLoad();
    Common.waitForLoad();
    Common.verifyPageTitle(pageTitles.applications);
    cy.testA11y(`${pageTitles.applications}`);
  }
}
