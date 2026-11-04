import { secretsPagePO } from '../pageObjects/pages-po';
import { Common } from '../../utils/Common';

export class SecretsPage {
  static checkValues(secretName: string, secretKey: string, secretValue: string) {
    cy.get(secretsPagePO.rowKebabButton(secretName)).click();
    cy.get(secretsPagePO.editButton).click();

    // Wait for navigation to the edit page.
    cy.url().should('include', 'edit');

    // Strategy change (iteration 4): waitForLoad() races with component
    // mount — it checks that spinners don't exist, which passes immediately
    // if called before the EditSecretForm Spinner mounts. Then the
    // default-timeout h1 assertion fails because the API call is still in
    // flight.
    //
    // Use the project-standard Common.verifyPageTitle() which retries
    // finding the h1 for up to 180 s, waiting through any loading states
    // (spinner → form render) without needing a separate waitForLoad guard.
    Common.verifyPageTitle('Edit secret');

    cy.contains('button', secretsPagePO.showValuesButton).click();
    cy.get(secretsPagePO.keyInputByValue(secretKey)).should('exist');
    cy.get(secretsPagePO.valueInput).scrollIntoView().should('have.value', secretValue);

    // Scroll the cancel button into view before clicking — the footer may
    // be below the fold in a scrollable container.
    cy.get(secretsPagePO.cancelButton).scrollIntoView().click();
    cy.url().should('not.include', 'edit');

    // Wait for the list to fully re-render after navigating back from the
    // edit page. Without these guards, subsequent commands (e.g. deleteSecret
    // in the after hook) can fire before the secret row is in the DOM.
    Common.waitForLoad();
    cy.get(secretsPagePO.listNameInput).should('be.visible');
    cy.get(secretsPagePO.secretRow(secretName)).should('exist');
  }

  static addSecret(secretName: string, secretKey: string, secretValue: string) {
    cy.contains('span', secretsPagePO.addSecretButtonLabel).click();
    cy.get(secretsPagePO.nameFilter).clear().type(secretName);
    cy.get(secretsPagePO.keyInput).scrollIntoView().clear().type(secretKey);
    cy.get(secretsPagePO.valueInput).scrollIntoView().clear().type(secretValue);
    cy.get(secretsPagePO.submitButton).click();

    // Wait for the create form to close and the list view to load. The
    // submit handler navigates back to the list asynchronously after the
    // API call completes — without this guard, the next command can run
    // while the page is still on the create route.
    cy.url().should('not.include', '/create');
    cy.get(secretsPagePO.secretsTab).should('exist');
  }

  static searchSecret(secretName: string, isListed: boolean) {
    cy.get(secretsPagePO.listNameInput).should('be.visible');
    cy.get(secretsPagePO.listNameInput).clear().type(secretName);
    cy.get(secretsPagePO.listNameInput).should('have.value', secretName);
    cy.url().should('include', `name=${secretName}`);
    if (isListed) {
      cy.get(secretsPagePO.secretRow(secretName)).should('exist');
    } else {
      cy.get(secretsPagePO.secretRow(secretName)).should('not.exist');
    }
  }

  static deleteSecret(secretName: string) {
    // Wait for the secret row to be visible before interacting with it.
    // After navigating back from edit, the list may still be re-rendering.
    cy.get(secretsPagePO.secretRow(secretName)).should('be.visible');
    cy.get(secretsPagePO.rowKebabButton(secretName)).click();
    cy.get(secretsPagePO.deleteButton).click();
    cy.get(secretsPagePO.deleteConfirmInput).click().type(secretName);
    cy.get(secretsPagePO.deleteResourceButton).click();
    cy.get(secretsPagePO.listNameInput).should('be.visible');
    cy.get(secretsPagePO.secretRow(secretName)).should('not.exist');
  }
}
