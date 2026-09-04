import { NavItem, pageTitles } from '../support/constants/PageTitle';
import { actions } from '../support/pageObjects/global-po';
import { userAccessPO } from '../support/pageObjects/userAccess-po';
import { issuesPagePO, secretsPagePO } from '../support/pageObjects/pages-po';
import { ApplicationDetailPage } from '../support/pages/ApplicationDetailPage';
import { ComponentDetailsPage } from '../support/pages/ComponentDetailsPage';
import { ComponentPage } from '../support/pages/ComponentsPage';
import { ContrastSwitcher, Contrasts, ThemeSwitcher, Themes } from '../support/pages/PageHeader';
import { SecretsPage } from '../support/pages/SecretsPage';
import { ComponentsTabPage } from '../support/pages/tabs/ComponentsTabPage';
import { IntegrationTestsTabPage } from '../support/pages/tabs/IntegrationTestsTabPage';
import {
  DetailsTab,
  PipelinerunsTabPage,
  TaskRunsTab,
} from '../support/pages/tabs/PipelinerunsTabPage';
import { UserAccessPage } from '../support/pages/UserAccessPage';
import { APIHelper } from '../utils/APIHelper';
import { Applications } from '../utils/Applications';
import { Common } from '../utils/Common';
import { Features } from '../utils/Features';
import { UIhelper } from '../utils/UIhelper';

describe('Basic Happy Path', () => {
  const applicationName = Common.generateAppName();
  const applicationDetailPage = new ApplicationDetailPage();
  const integrationTestsTab = new IntegrationTestsTabPage();
  const componentPage = new ComponentPage();

  const sourceOwner = Cypress.env('SOURCE_REPO_OWNER');
  const sourceRepo = Cypress.env('SOURCE_REPO_NAME');
  const repoName = Common.generateAppName(sourceRepo);
  const repoOwner = Cypress.env('GH_REPO_OWNER');
  const publicRepo = `https://github.com/${repoOwner}/${repoName}`;
  const componentName: string = Common.generateAppName('java-quarkus');

  const pipelineConfigs: Record<string, { tasks: string[]; logCheckTask: string }> = {
    'docker-build-oci-ta': {
      tasks: [
        'init',
        'clone-repository',
        'prefetch-dependencies',
        'build-container',
        'build-image-index',
        'apply-tags',
        'push-dockerfile',
      ],
      logCheckTask: 'push-dockerfile',
    },
    'docker-build-oci-ta-min': {
      tasks: ['init', 'clone-repository', 'build-container', 'build-image-index'],
      logCheckTask: 'build-container',
    },
  };

  const pipeline: string = Cypress.env('PIPELINE');
  const pipelineConfig = pipelineConfigs[pipeline];
  if (!pipelineConfig) {
    throw new Error(
      `Unknown pipeline "${pipeline}". Supported: ${Object.keys(pipelineConfigs).join(', ')}`,
    );
  }
  const piplinerunlogsTasks = pipelineConfig.tasks;

  // Track if any test has failed - used to skip deletion on failure
  let hasTestFailed = false;

  before(function () {
    if (Cypress.env('STUDIO_MODE')) {
      const baseUrl = Cypress.env('KONFLUX_BASE_URL') as string;

      // Studio replays in isolation — cache SSO cookies so replay skips the login redirect.
      cy.session(
        'konflux-sso',
        () => {
          cy.visit(baseUrl);
          cy.get('[id="page-sidebar"]', { timeout: 300000 }).should('be.visible');
        },
        {
          validate() {
            cy.request({ url: `${baseUrl}/oauth2/userinfo`, failOnStatusCode: false })
              .its('status')
              .should('eq', 200);
          },
        },
      );

      cy.visit(baseUrl);
      return;
    }

    APIHelper.createRepositoryFromTemplate(sourceOwner, sourceRepo, repoOwner, repoName);
    Features.resetToDefault();
  });

  afterEach(function () {
    if (this.currentTest?.state === 'failed') {
      hasTestFailed = true;
    }
  });

  describe('Create an Application with a component', () => {
    it('Create an Application with a component', () => {
      Applications.createApplication(applicationName);
      Applications.createComponent(publicRepo, componentName, pipeline);
      Applications.checkComponentInListView(
        componentName,
        applicationName,
        /Build not started|Build running/,
      );
    });

    it('Check different ways to add a component', () => {
      cy.log("Use 'Components' tabs to start adding a new component");
      Applications.goToOverviewTab().addComponent();
      cy.url().should('include', `/import?application=${applicationName}`);

      cy.log("Use HACBS 'Components' tabs to start adding a new component");
      Applications.clickBreadcrumbLink(applicationName);
      Applications.goToComponentsTab();
      ComponentsTabPage.clickAddComponent();
      cy.url().should('include', `/import?application=${applicationName}`);

      cy.log("Click 'Actions' dropdown to add a new component");
      Applications.clickBreadcrumbLink(applicationName);
      Applications.clickActionsDropdown('Add component');
      cy.url().should('include', `/import?application=${applicationName}`);
    });

    it('Check default Integration Test', () => {
      Applications.clickBreadcrumbLink(applicationName);
      Applications.goToIntegrationTestsTab();
      integrationTestsTab.hasIntegrationTest(`${applicationName}-enterprise-contract`);
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
      ComponentDetailsPage.verifyPipelineRunIsVisible(`${componentName}-on-pull`);
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
          // Use the pipelinerunName excluding the last hyphenated part "-<generated_number>"
          const lastDashIndex = pipelinerunName.lastIndexOf('-');
          const shortPipelinerunName =
            lastDashIndex !== -1 ? pipelinerunName.substring(0, lastDashIndex) : pipelinerunName;
          UIhelper.verifyLabelAndValue('Pipeline', shortPipelinerunName);
          UIhelper.verifyLabelAndValue('Application', applicationName);
          UIhelper.verifyLabelAndValue('Component', componentName);
          UIhelper.verifyLabelAndValue('Related pipelines', '0 pipelines');

          DetailsTab.waitForPLRAndDownloadAllLogs();

          UIhelper.verifyLabelAndValue('Related pipelines', '1 pipeline');

          //Verify the Pipeline run details Graph
          piplinerunlogsTasks.forEach((item) => {
            UIhelper.verifyGraphNodes(item);
          });

          // skip due to instaiblity
          // TaskRunsTab.goToTaskrunsTab();
          // TaskRunsTab.assertTaskAndTaskRunStatus(
          //   TaskRunsTab.getbasicTaskNamesList(pipelinerunName),
          // );
        });
    });

    it('Verify on-pull pipeline and EC', () => {
      cy.log('Verify that on-pull pipeline was cancelled');
      Applications.clickBreadcrumbLink('Pipeline runs');
      Applications.checkPipelineIsCancelled(componentName);

      cy.log('Verify Enterprise contract Test pipeline run Details');
      UIhelper.clickRowCellInTable('Pipeline run List', 'Test', `${applicationName}-`);
      // We encountered problems with EC checks on a local deployment,
      // so we only check for Succeeded status on the stage job
      if (Cypress.env('PERIODIC_RUN_STAGE') === 'true') {
        DetailsTab.waitForPLRAndDownloadAllLogs(false, 'Succeeded');
      } else {
        DetailsTab.waitForPLRAndDownloadAllLogs(false, '(Succeeded|Failed)');
      }
    });

    // Skipping this test until the issue is fixed
    // See https://redhat.atlassian.net/browse/KFLUXUI-1642
    it.skip('Verify vulnerabilities', () => {
      cy.log('Verifying vulnerabilities column exists in Pipeline runs table');
      Applications.clickBreadcrumbLink('Pipeline runs');
      PipelinerunsTabPage.verifyVulnerabilityColumn();

      cy.log('Verifying vulnerability indicators are displayed for on-push pipeline run');
      PipelinerunsTabPage.verifyVulnerabilityIndicators(
        `${componentName}-on-push`,
        /(-|N\/A|Critical\d+High\d+Medium\d+Low\d+Unknown\d+)/,
      );

      cy.log('Verifying vulnerability indicators for on-pull-request pipeline run');
      // Test passed for a page that was not fully loaded, test this functionality to prove it works as expected
      PipelinerunsTabPage.verifyVulnerabilityCellVisibility(`${componentName}-on-pull-request`);

      cy.log('Verifying vulnerability scan details for on-push pipeline run');
      PipelinerunsTabPage.verifyVulnerabilityScanDetails(`${componentName}-on-push`);
    });
  });

  describe('Check Component', () => {
    it('Check component build status and logs', () => {
      cy.log('Check component build status and logs');
      Applications.goToComponentsTab();
      Applications.checkComponentStatus(componentName, 'Build completed');

      cy.log('Validate Build Logs are successful');
      applicationDetailPage.openBuildLog(componentName);
      applicationDetailPage.verifyBuildLogTaskslist(piplinerunlogsTasks); //TO DO : Fetch the piplinerunlogsTasks from cluster using api At runtime.
      applicationDetailPage.verifyFailedLogTasksNotExists();
      applicationDetailPage.checkBuildLog(pipelineConfig.logCheckTask, 'Using token for quay.io');
      applicationDetailPage.closeBuildLog();

      cy.log('Verify deployed image exists');
      ComponentsTabPage.openComponent(componentName);
      ComponentDetailsPage.checkBuildImage();
    });
  });

  describe('Check Secrets Page', () => {
    const secretName = 'testing-secret-e2e-flow';
    const secretKey = 'mykey';
    const secretValue = 'myvalue';

    after(() => {
      // Delete secret
      SecretsPage.deleteSecret(secretName);
      // Search secret in a filter field, it should not be listed
      SecretsPage.searchSecret(secretName, false);
    });

    it('Add, Verify and Delete a secret', () => {
      cy.log('Navigate to Secrets page from the sidebar');
      Common.navigateTo(NavItem.secrets);
      Common.waitForLoad();
      cy.get(secretsPagePO.page).contains(secretsPagePO.pageDescription).should('exist');
      cy.get(secretsPagePO.secretsTab).should('exist');

      Common.waitForLoad();

      SecretsPage.addSecret(secretName, secretKey, secretValue);

      // Search secret in a filter field
      SecretsPage.searchSecret(secretName, true);
      // Verify secret values, no edition is done
      SecretsPage.checkValues(secretName, secretKey, secretValue);
    });
  });

  describe('Check Issues page', () => {
    it('Navigate to Issues page from the sidebar', () => {
      Common.navigateTo(NavItem.issues);
      Common.waitForLoad();

      if (!Cypress.env('LOCAL_CLUSTER')) {
        cy.get(issuesPagePO.page).contains(issuesPagePO.pageDescription).should('exist');
        cy.get(issuesPagePO.overviewTab).should('exist');
        cy.get(issuesPagePO.issuesTab).should('exist');
      } else {
        cy.get(issuesPagePO.serviceUnavailableState).should('exist');
        cy.contains(issuesPagePO.serviceUnavailableTitle).should('exist');
      }
    });
  });

  describe('User Access flow', () => {
    const username = `e2euser-${new Date().getTime()}`;
    const grantedRole = 'Contributor';
    const changedRole = 'Maintainer';

    after(() => {
      UserAccessPage.revokeAccess(username);

      cy.log('Verify the user was removed from the list');
      cy.contains(userAccessPO.listTableRow, username).should('not.exist');
    });

    it('Grant, change, and revoke user access', () => {
      cy.log('Navigate to the User Access page from the left navigation');
      Common.navigateTo(NavItem.userAcces);
      cy.url().should('match', /\/ns\/.+\/access$/);
      Common.verifyPageTitle('User access');
      cy.testA11y('User access page');

      UserAccessPage.grantAccess(username, grantedRole);
      cy.url().should('match', /\/ns\/.+\/access$/);

      UserAccessPage.verifyUserInTable(username, grantedRole);

      UserAccessPage.changeAccessRole(username, changedRole);

      UserAccessPage.verifyUserInTable(username, changedRole);
    });
  });

  describe('Check Page Header', () => {
    it('Check Theme Switcher', () => {
      // Checking Theme Switcher
      ThemeSwitcher.clickThemeSwitcher();
      ThemeSwitcher.switchTheme(Themes.SYSTEM, Themes.LIGHT);
      ThemeSwitcher.switchTheme(Themes.LIGHT, Themes.DARK);

      // Checking Contrast Switcher
      ContrastSwitcher.switchContrast(Contrasts.SYSTEM, Contrasts.DEFAULT);
      ContrastSwitcher.switchContrast(Contrasts.DEFAULT, Contrasts.HIGH);
    });
  });

  describe('Delete the application via UI', () => {
    before(function () {
      // Skip deletion if any previous test has failed on stage - preserve app for debugging
      if (hasTestFailed && Cypress.env('PERIODIC_RUN_STAGE')) {
        cy.log('⚠️ Skipping application deletion - previous tests failed');
        cy.log(`Application "${applicationName}" will be preserved for debugging`);
        this.skip();
      }
    });

    it('Delete the application via UI', () => {
      Common.navigateTo(NavItem.applications);
      Applications.filterApplication(applicationName);
      UIhelper.getTableRow('Application List', applicationName).should('be.visible');

      Applications.openKebabMenu(applicationName);
      cy.get(actions.deleteApp).click();
      cy.get(actions.deleteModalInput).clear().type(applicationName);
      cy.get(actions.deleteModalButton).click();

      // Verify the application is removed from the list after deletion
      cy.contains('[aria-label="Application List"] tr[role="row"]', applicationName, {
        timeout: 10000,
      }).should('not.exist');

      if (hasTestFailed) {
        cy.log('Skipping deletion of GitHub repository as test failed');
      } else {
        cy.log('Deleting GitHub repository after UI deletion is confirmed');
        APIHelper.deleteGitHubRepository(repoOwner, repoName);
      }
    });
  });
});
