import { NavItem, pageTitles } from '../support/constants/PageTitle';
import { localKonfluxLoginPO, stageLoginPO } from '../support/pageObjects/global-po';
import { GetStartedPage } from '../support/pages/GetStartedPage';
import { Common } from './Common';

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
    this.waitForApps();
  }

  private static waitForApps() {
    Common.waitForLoad();
    GetStartedPage.waitForLoad();
    Common.navigateTo(NavItem.applications);
    Common.verifyPageTitle(pageTitles.applications);
    Common.waitForLoad();
    cy.testA11y(`${pageTitles.applications} page`);
  }
}
