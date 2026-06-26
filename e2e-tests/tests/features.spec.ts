import { featureFlagsPO } from '../support/pageObjects/featureFlags-po';

describe('Test Features Flags', function () {
  it('System Notifications', function () {
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    cy.prompt(['Open Experimental Features', 'Click Reset to Defaults button']);
    cy.get(featureFlagsPO.systemNotifications).click({ force: true });
    cy.prompt([
      'Close the modal',
      'Click on some blank spot so hover labels are hidden in top menu',
      'Click a bell icon in the top menu',
      'A notification-drawer should be present on a page',
    ]);
  });
});
