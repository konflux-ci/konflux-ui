export class Features {
  static resetToDefault() {
    cy.get('[data-testid="experimental-features-icon"]').click();
    cy.get('[data-testid="reset-feature-overrides-button"]').click();
    cy.get('button[aria-label="Close"].pf-m-plain').click();
  }
}
