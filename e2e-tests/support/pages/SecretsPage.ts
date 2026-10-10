import { secretsPagePO } from '../pageObjects/pages-po';

export class SecretsPage {
  static checkValues(secretName: string, secretKey: string, secretValue: string) {
    cy.get(secretsPagePO.rowKebabButton(secretName)).click();
    cy.get(secretsPagePO.editButton).click();
    cy.contains('button', secretsPagePO.showValuesButton).click();
    cy.get(secretsPagePO.keyInputByValue(secretKey)).should('exist');
    cy.get(secretsPagePO.valueInput).scrollIntoView().should('have.value', secretValue);

    // Sometimes the edit url stays even when the test is already inputting text to the search field in a main page.
    // This assertion should synchronize page with a test.
    cy.url().should('include', 'edit');
    cy.get(secretsPagePO.cancelButton).click();
    cy.url().should('not.include', 'edit');
  }

  static addSecret(secretName: string, secretKey: string, secretValue: string) {
    cy.contains('span', secretsPagePO.addSecretButtonLabel).click();
    cy.get(secretsPagePO.nameFilter).clear().type(secretName);
    cy.get(secretsPagePO.keyInput).scrollIntoView().clear().type(secretKey);
    cy.get(secretsPagePO.valueInput).scrollIntoView().clear().type(secretValue);
    cy.get(secretsPagePO.submitButton).click();
  }

  static searchSecret(secretName: string, isListed: boolean) {
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
    cy.get(secretsPagePO.rowKebabButton(secretName)).click();
    cy.get(secretsPagePO.deleteButton).click();
    cy.get(secretsPagePO.deleteConfirmInput).click().type(secretName);
    cy.get(secretsPagePO.deleteResourceButton).click();
    cy.get(secretsPagePO.listNameInput).should('be.visible');
    cy.get(secretsPagePO.secretRow(secretName)).should('not.exist');
  }
}
