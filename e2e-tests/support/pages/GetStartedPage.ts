import { Common } from '../../utils/Common';
import { pageTitles } from '../constants/PageTitle';
import { getAppStartedPagePO, getNamespacesPagePo } from '../pageObjects/pages-po';

export class GetStartedPage {
  static waitForLoad() {
    Common.verifyPageTitle(pageTitles.getStartedPage);
    cy.get(getNamespacesPagePo.goToNamespacesLink)
      .should('be.visible')
      .and('have.attr', 'aria-disabled', 'false');
  }
}

export class GetAppStartedPage {
  static waitForLoad() {
    Common.verifyPageTitle(pageTitles.applications);
    cy.get(getAppStartedPagePO.createAppButton)
      .should('be.visible')
      .and('have.attr', 'aria-disabled', 'false');
  }
}
