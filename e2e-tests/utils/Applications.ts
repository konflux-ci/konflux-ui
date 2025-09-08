import { pageTitles, FULL_APPLICATION_TITLE } from '../support/constants/PageTitle';
import { addComponentPagePO } from '../support/pageObjects/createApplication-po';
import { actions, breadcrumb } from '../support/pageObjects/global-po';
import {
  actionsDropdown,
  componentsTabPO,
  pipelinerunsTabPO,
  integrationTestsTabPO,
  overviewTabPO,
  activityTabPO,
  latestCommitsTabPO,
  applicationsPagePO,
} from '../support/pageObjects/pages-po';
import { AddComponentPage } from '../support/pages/AddComponentPage';
import { ComponentPage } from '../support/pages/ComponentsPage';
import { CreateApplicationPage } from '../support/pages/CreateApplicationPage';
import { ComponentsTabPage } from '../support/pages/tabs/ComponentsTabPage';
import { OverviewTabPage } from '../support/pages/tabs/OverviewTabPage';
import { hacAPIEndpoints } from '../utils/APIEndpoints';
import { APIHelper } from '../utils/APIHelper';
import { Common } from './Common';
import { UIhelper } from './UIhelper';

export class Applications {
  static checkPipelineIsCancellingOrCancelled(componentName: string) {
    UIhelper.getTableRow('Pipeline run List', `${componentName}-on-pull-request`).then((row) => {
      const text = row.text();
      let isCancellingOrCancelled = false;
      if (text.includes('Cancelling')) {
        cy.log('Pipeline was in a state Cancelling.');
        isCancellingOrCancelled = true;
      } else if (text.includes('Cancelled')) {
        cy.log('Pipeline was in a state Cancelled.');
        isCancellingOrCancelled = true;
      } else {
        cy.log("Status wasn't Cancelling nor Cancelled.");
      }
      assert(isCancellingOrCancelled == true);
    });
  }

  static createCleanApp(applicationName: string) {
    cy.title().should('eq', `Applications | ${FULL_APPLICATION_TITLE}`);
    const createApplicationPage = new CreateApplicationPage();
    createApplicationPage.clickCreateApplication();
    cy.testA11y(`${pageTitles.createApp} page`);
    createApplicationPage.setApplicationName(applicationName);
    createApplicationPage.clickCreateApplication();
  }

  static deleteApplication(applicationName: string) {
    APIHelper.requestHACAPI({
      method: 'DELETE',
      url: hacAPIEndpoints.applications(applicationName),
      failOnStatusCode: false,
    });
  }

  static openKebabMenu(applicationName: string) {
    cy.get(`[data-id="${applicationName}"]`).find(actions.kebabButton).click();
  }

  static createApplication(applicationName: string) {
    cy.title().should('eq', `${FULL_APPLICATION_TITLE}`);
    const createApplicationPage = new CreateApplicationPage();
    createApplicationPage.clickCreateApplication();
    cy.title().should('eq', `${FULL_APPLICATION_TITLE}`);
    cy.testA11y(`${pageTitles.createApp} page`);
    createApplicationPage.setApplicationName(applicationName);
    createApplicationPage.clickAddComponent();
  }

  static createComponent(
    publicGitRepo: string,
    componentName: string,
    pipeline: string,
    isPrivate: boolean = false,
    applicationName?: string,
    dockerfilePath?: string,
    secret?: { secretName: string; key: string; value: string },
  ) {
    const addComponent = new AddComponentPage();
    const componentPage = new ComponentPage();

    addComponent.setSource(publicGitRepo);
    this.configureComponentsStep(componentName, pipeline, applicationName, dockerfilePath, secret);
    // make sure advanced git options is closed, so the repo validation icon is in the viewport
    cy.contains('button', 'Hide advanced Git options').click();
    addComponent.waitRepoValidated();
    if (isPrivate) {
      addComponent.setPrivate();
    }
    componentPage.clickSubmitButton();
  }

  static checkComponentInListView(
    componentName: string,
    applicationName: string,
    componentStatus: string | RegExp,
  ) {
    this.createdComponentExists(componentName, applicationName);
    this.checkComponentStatus(componentName, componentStatus);
  }

  static createdComponentExists(componentName: string, applicationName: string) {
    this.goToComponentsTab();

    Common.verifyPageTitle(applicationName);
    Common.waitForLoad();
    ComponentsTabPage.getComponentListItem(componentName).should('exist');
  }

  static checkComponentStatus(componentName: string, componentStatus: string | RegExp) {
    cy.get(componentsTabPO.componentListItem(componentName)).contains(componentStatus, {
      timeout: 80000,
    });
  }

  static checkBuildTrigger(componentName: string, componentLabel: string) {
    cy.get(componentsTabPO.componentListItem(componentName)).contains(componentLabel, {
      timeout: 15000,
    });
  }

  static clickActionsDropdown(dropdownItem: string) {
    cy.get(actionsDropdown.dropdown).click();
    cy.contains(dropdownItem).click();
  }

  static clickBreadcrumbLink(link: string) {
    cy.get(breadcrumb.breadcrumbLink).contains(link).click();
    Common.waitForLoad();
  }

  static goToOverviewTab() {
    cy.get(overviewTabPO.clickTab).click();
    Common.waitForLoad();
    return new OverviewTabPage();
  }

  static goToComponentsTab() {
    cy.get(componentsTabPO.clickTab).click();
  }

  static goToActivityTab() {
    cy.get(activityTabPO.clickTab, { timeout: 30000 }).click();
    Common.waitForLoad();
  }

  static goToLatestCommitsTab() {
    this.goToActivityTab();
    cy.get(latestCommitsTabPO.clickTab, { timeout: 30000 }).click();
  }

  static goToPipelinerunsTab() {
    this.goToActivityTab();
    cy.get(pipelinerunsTabPO.clickTab, { timeout: 30000 }).click();
    Common.waitForLoad();
  }

  static goToIntegrationTestsTab() {
    cy.get(integrationTestsTabPO.clickTab).click();
    Common.waitForLoad();
  }

  static configureComponentsStep(
    componentName: string,
    pipeline: string,
    applicationName?: string,
    dockerfilePath?: string,
    secret?: { secretName: string; key: string; value: string },
  ) {
    const componentPage = new ComponentPage();
    componentPage.editComponentName(componentName);
    componentPage.setPipeline(pipeline);

    if (applicationName) {
      componentPage.setApplicationName(applicationName);
    }
    if (dockerfilePath) {
      componentPage.setDockerfilePath(dockerfilePath);
    }
    if (secret) {
      UIhelper.clickButton('Add secret');
      cy.contains(applicationsPagePO.formGroup, 'Select or enter secret name').within(() => {
        cy.get('input').clear().type(secret.secretName);
        cy.contains(
          'button',
          `${secret.secretName === 'snyk-secret' ? '' : 'Create "'}${secret.secretName}`,
        ).click();
      });
      if (secret.secretName !== 'snyk-secret') {
        cy.get(applicationsPagePO.secretKey).clear().type(secret.key);
      }
      cy.get(applicationsPagePO.secretValue)
        .clear()
        .invoke('attr', 'style', 'color: transparent;text-shadow: 0 0 8px rgba(0,0,0,0.5);')
        .type(secret.value, { log: false });
      UIhelper.clickButton('Create').should('not.exist');
    }
  }

  static verifySecretUsingAPI(secretName: string, key: string, value: string) {
    APIHelper.requestHACAPI({ url: hacAPIEndpoints.secrets(secretName) })
      .its(`body.data.${key}`)
      .should('eq', Buffer.from(value, 'utf8').toString('base64'));
  }
}
