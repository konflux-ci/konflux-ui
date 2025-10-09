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
      componentPage.clickMergePullRequest();

      APIHelper.mergePR(
        repoOwner,
        repoName,
        1,
        'firstCommit',
        'This PR was auto-generated by appstudio-ci__bot',
      );

      // Remove after the following issue is fixed
      // See https://issues.redhat.com/browse/KFLUXUI-766
      cy.wait(5000);

      // Temporarily disable the wait for PR merge until the issue is fixed
      // See https://issues.redhat.com/browse/KFLUXUI-766
      // componentPage.verifyAndWaitForPRMerge();
      componentPage.closeModal();

      Applications.clickBreadcrumbLink(applicationName);
    });

    it('Verify the Pipeline run details and Node Graph view', function () {
      Applications.goToPipelinerunsTab();
      Applications.checkPipelineIsCancellingOrCancelled(componentName);

      UIhelper.getTableRow('Pipeline run List', `${componentName}-on-push`)
        .contains(componentName)
        .invoke('text')
        .then((pipelinerunName) => {
          UIhelper.checkTableHasRows('Pipeline run List', componentName, 2);
          UIhelper.clickRowCellInTable('Pipeline run List', pipelinerunName, pipelinerunName);
          UIhelper.verifyLabelAndValue('Namespace', Cypress.env('HAC_NAMESPACE'));
          UIhelper.verifyLabelAndValue('Pipeline', pipelinerunName);
          UIhelper.verifyLabelAndValue('Application', applicationName);
          UIhelper.verifyLabelAndValue('Component', componentName);
          UIhelper.verifyLabelAndValue('Related pipelines', '\\d+ pipelines?');

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

    it('Verify that on-pull pipeline was cancelled', () => {
      Applications.clickBreadcrumbLink('Pipeline runs');
      UIhelper.getTableRow('Pipeline run List', `${componentName}-on-pull-request`).should(
        'contain.text',
        'Cancelled',
      );
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
});
