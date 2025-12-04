import { featureFlagsPO } from '../support/pageObjects/featureFlags-po';

describe('Test Features Flags', function () {
  // skipping the Issue Dashboard test because we need to enable Kite first.
  it.skip('issueDashboard', function () {
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    cy.prompt(['Open Experimental Features', 'Click Reset to Defaults button']);
    cy.get(featureFlagsPO.issueDashboard).click({ force: true });
    cy.prompt([
      'Close the modal',
      'Click Issues in the menu',
      'Verify that the title is Issues Unstable',
      'Verify that Overview and Issues tabs are present on the page',
    ]);
  });

  it('Release Monitor', function () {
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    cy.prompt(['Open Experimental Features', 'Click Reset to Defaults button']);
    cy.get(featureFlagsPO.releaseMonitor).click({ force: true });
    cy.prompt([
      'Close the modal',
      'Click Release Monitor in the main menu',
      'Verify that the title is Release Monitor Unstable',
      'Verify there is No releases found text on the page body',
      'Verify that the link Learn more is a valid URL',
    ]);
  });

  it('System Notifications', function () {
    cy.visit(Cypress.env('KONFLUX_BASE_URL'));
    cy.prompt(['Open Experimental Features', 'Click Reset to Defaults button']);
    cy.get(featureFlagsPO.systemNotifications).click({ force: true });
    cy.prompt([
      'Close the modal',
      'Click on some blank spot so hover labels are hidden in top menu',
      'Click a bell icon in the top menu',
      'A drawer should be opened on a right side of the page',
    ]);
  });
});
