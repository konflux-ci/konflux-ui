import { NavItem } from '../support/constants/PageTitle';
import { actions } from '../support/pageObjects/global-po';
import { ApplicationDetailPage } from '../support/pages/ApplicationDetailPage';
import { ComponentDetailsPage } from '../support/pages/ComponentDetailsPage';
import { ComponentPage } from '../support/pages/ComponentsPage';
import { GetAppStartedPage } from '../support/pages/GetStartedPage';
import { ComponentsTabPage } from '../support/pages/tabs/ComponentsTabPage';
import { IntegrationTestsTabPage } from '../support/pages/tabs/IntegrationTestsTabPage';
import { DetailsTab, TaskRunsTab } from '../support/pages/tabs/PipelinerunsTabPage';
import { APIHelper } from '../utils/APIHelper';
import { Applications } from '../utils/Applications';
import { Common } from '../utils/Common';
import { UIhelper } from '../utils/UIhelper';

describe('Basic Happy Path', () => {
  const applicationName = Common.generateAppName();
  const applicationDetailPage = new ApplicationDetailPage();
  const integrationTestsTab = new IntegrationTestsTabPage();
  const componentPage = new ComponentPage();

  const sourceOwner = 'hac-test';
  const sourceRepo = 'devfile-sample-code-with-quarkus';
  const repoName = Common.generateAppName(sourceRepo);
  const repoOwner = Cypress.env('GH_REPO_OWNER');
  const publicRepo = `https://github.com/${repoOwner}/${repoName}`;
  const componentName: string = Common.generateAppName('java-quarkus');
  const piplinerunlogsTasks = [
    'init',
    'clone-repository',
    'build-container',
    'apply-tags',
    'push-dockerfile',
  ];
  const pipeline = 'docker-build-oci-ta';

  before(function () {
    APIHelper.createRepositoryFromTemplate(sourceOwner, sourceRepo, repoOwner, repoName);
  });

  after(function () {
    // If some test failed, don't remove the app
    let allTestsSucceeded = true;
    this.test.parent.eachTest((test) => {
      if (test.state === 'failed') {
        allTestsSucceeded = false;
      }
    });
    if (allTestsSucceeded || Cypress.env('REMOVE_APP_ON_FAIL')) {
      // use UI to remove the application to test the flow
      // The below command aims to navigate to applications page.
      // but it does not work well. Because when I add the
      // 'GetAppStartedPage.waitForLoad()' after the step, it failed.
      Common.navigateTo(NavItem.applications);
      // we only delete the app when cy get the app.
      // it means we would skip 'delete app' sometimes.
      length = Cypress.$(`[data-id="${applicationName}"`).length;

      if (length > 0) {
        Applications.openKebabMenu(applicationName);
        cy.get(actions.deleteApp)
          .its('length')
          .then((deleteLength) => {
            if (deleteLength > 0) {
              cy.get(actions.deleteApp).click();
              cy.get(actions.deleteModalInput).clear().type(applicationName);
              cy.get(actions.deleteModalButton).click();
            }
          });
      }

      APIHelper.deleteGitHubRepository(repoOwner, repoName);
    }
  });

  it('Create an Application with a component', () => {
    Applications.createApplication(applicationName);
    Applications.createComponent(publicRepo, componentName, pipeline);
    Applications.checkComponentInListView(
      componentName,
      applicationName,
      /Build not started|Build running/,
    );
  });
});
