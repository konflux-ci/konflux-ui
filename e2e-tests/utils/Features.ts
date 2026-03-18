import { featuresPO } from '../support/pageObjects/featureFlags-po';

export class Features {
  static resetToDefault() {
    cy.get(featuresPO.experimentalFeaturesIcon).click();
    cy.get(featuresPO.resetFeatureOverridesButton).click();
    cy.get(featuresPO.modalCloseButton).click();
  }
}
