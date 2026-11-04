import { secretsPagePO } from '../pageObjects/pages-po';
import { Common } from '../../utils/Common';

export class SecretsPage {
  static checkValues(secretName: string, secretKey: string, secretValue: string) {
    cy.get(secretsPagePO.rowKebabButton(secretName)).click();
    cy.get(secretsPagePO.editButton).click();

    // Wait for navigation to the edit page.
    cy.url().should('include', 'edit');

    // Strategy change (iteration 3): previous iterations relied on the
    // cancel button as a sync guard, but it lives inside the FormFooter
    // which only renders after Formik mounts. If the K8s API call
    // (useSecretMetadata) is slow or fails, the form never mounts and the
    // cancel button never enters the DOM.
    //
    // New approach: use the project-standard Common.waitForLoad() to wait
    // for all loading indicators (spinners, skeletons) to disappear, then
    // verify the form heading is visible — confirming the API returned data
    // and the Formik form mounted.
    Common.waitForLoad();
    cy.contains('h1', 'Edit secret').should('be.visible');

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
