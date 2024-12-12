import { FULL_APPLICATION_TITLE, NavItem } from '../support/constants/PageTitle';
import { actions } from '../support/pageObjects/global-po';
import { ApplicationDetailPage } from '../support/pages/ApplicationDetailPage';
import {
  ComponentDetailsPage,
  ComponentPageTabs,
  DeploymentsTab,
} from '../support/pages/ComponentDetailsPage';
import { ComponentPage } from '../support/pages/ComponentsPage';
import { ComponentsTabPage } from '../support/pages/tabs/ComponentsTabPage';
import { IntegrationTestsTabPage } from '../support/pages/tabs/IntegrationTestsTabPage';
import {
  DetailsTab,
  PipelinerunsTabPage,
  TaskRunsTab,
} from '../support/pages/tabs/PipelinerunsTabPage';
import { APIHelper } from '../utils/APIHelper';
import { Applications } from '../utils/Applications';
import { Common } from '../utils/Common';
import { UIhelper } from '../utils/UIhelper';

describe('Basic Happy Path', () => {
  const applicationName = Common.generateAppName();
  // const applicationName = "test-app-173261349";
  const applicationDetailPage = new ApplicationDetailPage();
  const integrationTestsTab = new IntegrationTestsTabPage();
  const componentPage = new ComponentPage();

  const sourceOwner = 'hac-test';
  const sourceRepo = 'devfile-sample-code-with-quarkus';
  const repoName = Common.generateAppName(sourceRepo);
  // const repoName = "java-quarkus-173261349"
  const repoOwner = 'redhat-hac-qe';
  const publicRepo = `https://github.com/${repoOwner}/${repoName}`;
  // const publicRepo = 'https://github.com/redhat-hac-qe/devfile-sample-code-with-quarkus-173218691'
  const componentName: string = Common.generateAppName('java-quarkus');
  // const componentName = "java-quarkus-173261349"
  const piplinerunlogsTasks = ['init', 'clone-repository', 'build-container', 'show-sbom'];
  const quarkusDeplomentBody = 'Congratulations, you have created a new Quarkus cloud application';
  // this is default option and should be the fastest one
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
      Common.navigateTo(NavItem.applications);
      Applications.openKebabMenu(applicationName);
      cy.get(actions.deleteApp).click();
      cy.get(actions.deleteModalInput).clear().type(applicationName);
      cy.get(actions.deleteModalButton).click();
      cy.get(`[data-id="${applicationName}"]`).should('not.exist');
      APIHelper.deleteGitHubRepository(repoName);
    }
  });

  it('Create an Application with a component', () => {
    Applications.createApplication(applicationName);
    Applications.createComponent(publicRepo, componentName, pipeline);
    // cy.visit("https://localhost:8080/workspaces/kkanova-tenant/applications/test-app-173261349")
    Applications.checkComponentInListView(componentName, applicationName, 'Build not started');
  });

  it('Check default Integration Test', () => {
    Applications.goToIntegrationTestsTab();
    integrationTestsTab.hasIntegrationTest(`${applicationName}-enterprise-contract`);
  });

  describe('Check different ways to add a component', () => {
    afterEach(() => {
      Applications.clickBreadcrumbLink(applicationName);
      cy.url().should('include', `${applicationName}`);
    });

    it("Use 'Components' tabs to start adding a new component", () => {
      Applications.goToOverviewTab().addComponent();
      cy.url().should('include', `/import?application=${applicationName}`);
    });

    it("Use HACBS 'Components' tabs to start adding a new component", () => {
      Applications.goToComponentsTab();
      ComponentsTabPage.clickAddComponent();
      cy.url().should('include', `/import?application=${applicationName}`);
    });

    it("Click 'Actions' dropdown to add a component", () => {
      Applications.clickActionsDropdown('Add component');
      cy.url().should('include', `/import?application=${applicationName}`);
    });
  });

  describe('Explore Pipeline runs Tab', () => {
    after(() => {
      Applications.clickBreadcrumbLink(applicationName);
    });

    it('Merge the auto-generated PR, and verify the event status on modal', () => {
      Applications.goToComponentsTab();
      // Pipeline build plan was removed from the Pipeline runs Tab
      // See https://issues.redhat.com/browse/KFLUXBUGS-603
      ComponentsTabPage.openComponent(componentName);
      // Use clickSendingPullRequest() until the bug is fixed
      // https://issues.redhat.com/browse/KFLUXUI-226
      componentPage.clickSendingPullRequest();
      // componentPage.clickMergePullRequest();
      componentPage.verifyAndWaitForPRIsSent();

      APIHelper.mergePR(
        repoOwner,
        repoName,
        1,
        'firstCommit',
        'This PR was auto-generated by appstudio-ci__bot',
      );

      // Disabled due to bug https://issues.redhat.com/browse/KFLUXBUGS-1307
      // componentPage.verifyAndWaitForPRMerge();

      componentPage.closeModal();
      // Go back to Components tab
      Applications.clickBreadcrumbLink(applicationName);
      Applications.goToComponentsTab();
    });

    it('Verify the Pipeline run details and Node Graph view', () => {
      Applications.goToPipelinerunsTab();
      UIhelper.getTableRow('Pipeline run List', `${componentName}-on-pull-request`)
        .contains(componentName)
        .invoke('text')
        .then((pipelinerunName) => {
          UIhelper.checkTableHasRows('Pipeline run List', componentName, 2);
          UIhelper.clickRowCellInTable('Pipeline run List', pipelinerunName, pipelinerunName);
          UIhelper.verifyLabelAndValue('Namespace', Cypress.env('HAC_NAMESPACE'));
          UIhelper.verifyLabelAndValue('Pipeline', pipelinerunName);
          UIhelper.verifyLabelAndValue('Application', applicationName);
          UIhelper.verifyLabelAndValue('Component', componentName);
          UIhelper.verifyLabelAndValue('Related pipelines', '0 pipelines');

          DetailsTab.waitForPLRAndDownloadAllLogs();

          //Verify the Pipeline run details Graph
          piplinerunlogsTasks.forEach((item) => {
            UIhelper.verifyGraphNodes(item);
          });

          TaskRunsTab.goToTaskrunsTab();
          TaskRunsTab.assertTaskAndTaskRunStatus(
            TaskRunsTab.getbasicTaskNamesList(pipelinerunName),
          );
        });
    });

    it('Wait for on-push build to finish', () => {
      Applications.clickBreadcrumbLink('Pipeline runs');
      UIhelper.checkTableHasRows('Pipeline run List', 'test', 2);
    });

    it('Verify Enterprise contract Test pipeline run Details', () => {
      UIhelper.clickRowCellInTable('Pipeline run List', 'Test', `${applicationName}-`);
      DetailsTab.waitForPLRAndDownloadAllLogs(false);
    });
  });

  describe('Check Component in Components tab', () => {
    before(() => {
      Applications.goToComponentsTab();
    });

    it('Check component build status', () => {
      Applications.checkComponentStatus(componentName, 'Build completed');
    });

    it('Validate Build Logs are successful', () => {
      applicationDetailPage.openBuildLog(componentName);
      applicationDetailPage.verifyBuildLogTaskslist(piplinerunlogsTasks); //TO DO : Fetch the piplinerunlogsTasks from cluster using api At runtime.
      applicationDetailPage.verifyFailedLogTasksNotExists();
      applicationDetailPage.checkBuildLog('push-dockerfile', 'Selecting auth for quay.io');
      applicationDetailPage.closeBuildLog();
    });
  });

  describe('Check Component Details', () => {
    before(() => {
      ComponentsTabPage.openComponent(componentName);
    });

    it('Verify deployed image exists', () => {
      ComponentDetailsPage.checkBuildImage();
    });
  });

  describe('Check Application Overview', () => {
    before(() => {
      Common.openApplicationURL(applicationName);
    });

    it('Validate the graph views for the created application', () => {
      UIhelper.verifyGraphNodes('Components', false);
      UIhelper.verifyGraphNodes('Builds');
    });
  });
});
