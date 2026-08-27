import { secretsPagePO } from '../pageObjects/pages-po';

export class SecretsPage {
  static checkValues(secretName: string, secretKey: string, secretValue: string) {
    cy.get(secretsPagePO.rowKebabButton(secretName)).click();
    cy.get(secretsPagePO.editButton).click();
    cy.contains('button', secretsPagePO.showValuesButton).click();
    cy.get(secretsPagePO.keyInputByValue(secretKey)).should('exist');
    cy.get(secretsPagePO.valueInput).scrollIntoView().should('has.value', secretValue);
    cy.get(secretsPagePO.cancelButton).click();
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
  }
}
