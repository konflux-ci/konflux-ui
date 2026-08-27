import { UIhelperPO } from '../pageObjects/global-po';
import { userAccessPO } from '../pageObjects/userAccess-po';

export class UserAccessPage {
  static getTableRow(username: string) {
    return cy.contains(userAccessPO.listTableRow, username).scrollIntoView();
  }

  static grantAccess(username: string, role: string) {
    cy.log(`Grant "${role}" access to user "${username}"`);
    cy.contains(UIhelperPO.pf6_button, 'Grant access').click();

    cy.log('Enter the username');
    cy.get(userAccessPO.usernameInput).find('input').type(`${username}{enter}`);
    cy.get(userAccessPO.usernameInput).should('contain', username);

    cy.log(`Select the role "${role}"`);
    cy.get(userAccessPO.roleDropdownToggle).click();
    cy.get(userAccessPO.roleDropdownListbox).contains(role).click();

    cy.log('Submit the grant access form');
    cy.get(userAccessPO.submitButton).should('be.enabled').click();
  }

  static verifyUserInTable(username: string, role: string) {
    // search for the user in the table
    cy.get(userAccessPO.searchInput).should('be.visible');
    cy.get(userAccessPO.searchInput).clear();
    cy.get(userAccessPO.searchInput).type(username);

    cy.contains(userAccessPO.listTableRow, username).scrollIntoView();
    cy.contains(userAccessPO.listTableRow, username).within(() => {
      cy.contains(role).should('be.visible');
    });
  }

  static changeAccessRole(username: string, newRole: string) {
    cy.log(`Change the role of user "${username}" to "${newRole}"`);
    UserAccessPage.getTableRow(username).find(userAccessPO.rowCheckbox).check();
    cy.get(userAccessPO.changeAccessButton).should('be.enabled').click();

    cy.get(userAccessPO.changeRoleModal).should('be.visible');
    cy.get(userAccessPO.changeRoleSelect).click();
    // PF6 renders the Select menu in a fixed-position popper outside the modal
    cy.get('[role="listbox"]:visible').contains(newRole).click();
    cy.get(userAccessPO.changeRoleModal).contains('button', 'Save').click();
    cy.get(userAccessPO.changeRoleModal).should('not.exist');
  }

  static revokeAccess(username: string) {
    cy.log(`Revoke access for user "${username}"`);
    UserAccessPage.getTableRow(username).find(userAccessPO.rowKebab).click();
    cy.get(userAccessPO.revokeAccessItem).click();
    cy.get(userAccessPO.revokeAccessModal).should('be.visible');
    cy.get(userAccessPO.revokeAccessConfirm).click();
    cy.get(userAccessPO.revokeAccessModal).should('not.exist');
  }
}
