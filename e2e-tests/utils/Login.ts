import common = require('mocha/lib/interfaces/common');
import { NavItem, pageTitles } from '../support/constants/PageTitle';
import { localKonfluxLoginPO, stageLoginPO } from '../support/pageObjects/global-po';
import { GetStartedPage, GetAppStartedPage } from '../support/pages/GetStartedPage';
import { Common } from './Common';
import { goToApplicationsPagePo } from '../support/pageObjects/pages-po';

export class Login {
  static login(
    username: string = Cypress.env('USERNAME'),
    password: string = Cypress.env('PASSWORD'),
  ) {
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    cy.get(stageLoginPO.dex).should('be.visible').click();
    // disabling as we don't have testing account on stage, manual log in is needed
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
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    cy.get(localKonfluxLoginPO.dex).should('be.visible').click();
    cy.get(localKonfluxLoginPO.username).type(username);
    cy.get(localKonfluxLoginPO.password).type(password, { log: false });
    cy.get(localKonfluxLoginPO.loginButton).click();
    cy.contains(localKonfluxLoginPO.grantAccessClass, localKonfluxLoginPO.grantAccessText).click();
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
    cy.get(
      goToApplicationsPagePo(`${Cypress.env('HAC_NAMESPACE')}`).goToApplicationsPagePo,
    ).click();
    Common.waitForLoad();
    GetAppStartedPage.waitForLoad();
    Common.verifyPageTitle(pageTitles.applications);
    Common.waitForLoad();
    cy.testA11y(`${pageTitles.applications}`);
  }
}
