import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '../AppRoot/AppRoot';
import { ActivityTab } from '../components/Activity';
import { ApplicationDetails, ApplicationOverviewTab } from '../components/ApplicationDetails';
import {
  CommitDetailsView,
  CommitOverviewTab,
  CommitsPipelineRunTab,
} from '../components/Commits/CommitDetails';
import { ComponentListTab, componentsTabLoader } from '../components/Components/ComponentsListView';
import { GithubRedirect, githubRedirectLoader } from '../components/GithubRedirect';
import {
  integrationDetailsPageLoader,
  IntegrationTestDetailsView,
  IntegrationTestOverviewTab,
  IntegrationTestPipelineRunTab,
} from '../components/IntegrationTests/IntegrationTestDetails';
import {
  IntegrationTestCreateForm,
  integrationTestCreateFormLoader,
  IntegrationTestEditForm,
  integrationTestEditFormLoader,
} from '../components/IntegrationTests/IntegrationTestForm';
import {
  integrationListPageLoader,
  IntegrationTestsListView,
} from '../components/IntegrationTests/IntegrationTestsListView';
import { ModalProvider } from '../components/modal/ModalProvider';
import { Overview } from '../components/Overview/Overview';
import {
  PipelineRunDetailsLayout,
  PipelineRunDetailsLogsTab,
  PipelineRunDetailsTab,
  pipelineRunDetailsViewLoader,
  PipelineRunSecurityEnterpriseContractTab,
  PipelineRunTaskRunsTab,
} from '../components/PipelineRun/PipelineRunDetailsView';
import {
  ReleaseDetailsLayout,
  releaseDetailsViewLoader,
  ReleaseListViewTab,
  releaseListViewTabLoader,
  ReleaseOverviewTab,
} from '../components/Releases';
import {
  releasePlanAdmissionListLoader,
  ReleasePlanAdmissionListView,
  releasePlanCreateFormLoader,
  ReleasePlanCreateFormPage,
  releasePlanEditFormLoader,
  ReleasePlanEditFormPage,
  releasePlanListLoader,
  ReleasePlanListView,
  releasePlanTriggerLoader,
  ReleaseService,
  TriggerReleaseFormPage,
} from '../components/ReleaseService';
import { AddSecretForm, SecretsListPage, secretListViewLoader } from '../components/Secrets';
import {
  SnapshotDetailsView,
  snapshotDetailsViewLoader,
  SnapshotOverviewTab,
  SnapshotPipelineRunsTab,
} from '../components/SnapshotDetails';
import {
  TaskRunDetailsTab,
  TaskRunDetailsViewLayout,
  taskRunDetailsViewLoader,
  TaskRunLogsTab,
  TaskrunSecurityEnterpriseContractTab,
} from '../components/TaskRunDetailsView';
import {
  GrantAccessPage,
  grantAccessPageLoader,
  UserAccessListPage,
  userAccessListPageLoader,
} from '../components/UserAccess';
import { workspaceLoader, WorkspaceProvider } from '../components/Workspace';
import { HttpError } from '../k8s/error';
import ErrorEmptyState from '../shared/components/empty-state/ErrorEmptyState';
import { namespaceLoader, NamespaceProvider } from '../shared/providers/Namespace';
import applicationRoutes from './page-routes/application';
import componentRoutes from './page-routes/components';
import workspaceRoutes from './page-routes/workspace';
import { RouteErrorBoundry } from './RouteErrorBoundary';
import { GithubRedirectRouteParams, RouterParams } from './utils';

export const router = createBrowserRouter([
  {
    path: '/',
    loader: async (params) => {
      // [TODO]: change this once all pages use the namespace loader.
      void namespaceLoader(params);
      return await workspaceLoader(params);
    },
    errorElement: <RouteErrorBoundry />,
    element: (
      <WorkspaceProvider>
        <NamespaceProvider>
          <ModalProvider>
            <AppRoot />
          </ModalProvider>
        </NamespaceProvider>
      </WorkspaceProvider>
    ),
    children: [
      {
        index: true,
        element: <Overview />,
      },
      ...applicationRoutes,
      ...workspaceRoutes,
      ...componentRoutes,

      /* Application details */
      {
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}`,
        element: <ApplicationDetails />,
        errorElement: <RouteErrorBoundry />,
        children: [
          {
            index: true,
            element: <ApplicationOverviewTab />,
          },
          {
            path: `activity/:${RouterParams.activityTab}`,
            element: <ActivityTab />,
          },
          {
            path: `activity`,
            element: <ActivityTab />,
          },
          {
            path: 'components',
            loader: componentsTabLoader,
            errorElement: <RouteErrorBoundry />,
            element: <ComponentListTab />,
          },
          {
            path: 'integrationtests',
            loader: integrationListPageLoader,
            errorElement: <RouteErrorBoundry />,
            element: <IntegrationTestsListView />,
          },
          {
            path: 'releases',
            loader: releaseListViewTabLoader,
            errorElement: <RouteErrorBoundry />,
            element: <ReleaseListViewTab />,
          },
        ],
      },
      /* IntegrationTestScenario routes */
      {
        // create form
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/add`,
        loader: integrationTestCreateFormLoader,
        errorElement: <RouteErrorBoundry />,
        element: <IntegrationTestCreateForm />,
      },
      /* Integration test edit form */
      {
        // edit form
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/:${RouterParams.integrationTestName}/edit`,
        loader: integrationTestEditFormLoader,
        errorElement: <RouteErrorBoundry />,
        element: <IntegrationTestEditForm />,
      },
      /* Integration tests Details routes */
      {
        // details page
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/:${RouterParams.integrationTestName}`,
        loader: integrationDetailsPageLoader,
        errorElement: <RouteErrorBoundry />,
        element: <IntegrationTestDetailsView />,
        children: [
          {
            index: true,
            element: <IntegrationTestOverviewTab />,
          },
          {
            path: 'pipelineruns',
            element: <IntegrationTestPipelineRunTab />,
          },
        ],
      },
      /* Release routes */
      {
        // details page
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/releases/:${RouterParams.releaseName}`,
        loader: releaseDetailsViewLoader,
        errorElement: <RouteErrorBoundry />,
        element: <ReleaseDetailsLayout />,
        children: [
          {
            index: true,
            element: <ReleaseOverviewTab />,
          },
        ],
      },
      /* Pipeline Run details routes */
      {
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/pipelineruns/:${RouterParams.pipelineRunName}`,
        errorElement: <RouteErrorBoundry />,
        loader: pipelineRunDetailsViewLoader,
        element: <PipelineRunDetailsLayout />,
        children: [
          { index: true, element: <PipelineRunDetailsTab /> },
          { path: 'taskruns', element: <PipelineRunTaskRunsTab /> },
          { path: 'logs', element: <PipelineRunDetailsLogsTab /> },
          { path: 'security', element: <PipelineRunSecurityEnterpriseContractTab /> },
        ],
      },
      /* Task Run details routes */
      {
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/taskruns/:${RouterParams.taskRunName}`,
        errorElement: <RouteErrorBoundry />,
        loader: taskRunDetailsViewLoader,
        element: <TaskRunDetailsViewLayout />,
        children: [
          { index: true, element: <TaskRunDetailsTab /> },
          { path: 'logs', element: <TaskRunLogsTab /> },
          { path: 'security', element: <TaskrunSecurityEnterpriseContractTab /> },
        ],
      },
      /* Commit list view */
      {
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/commit/:${RouterParams.commitName}`,
        errorElement: <RouteErrorBoundry />,
        element: <CommitDetailsView />,
        children: [
          { index: true, element: <CommitOverviewTab /> },
          { path: 'pipelineruns', element: <CommitsPipelineRunTab /> },
        ],
      },
      /* Secrets create form */
      {
        path: `workspaces/:workspaceName/secrets/create`,
        element: <AddSecretForm />,
        errorElement: <RouteErrorBoundry />,
      },
      /* Secrets list view */
      {
        path: `workspaces/:${RouterParams.workspaceName}/secrets`,
        loader: secretListViewLoader,
        element: <SecretsListPage />,
        errorElement: <RouteErrorBoundry />,
      },
      /* Trigger Release plan */
      {
        path: `workspaces/:${RouterParams.workspaceName}/release/release-plan/trigger/:${RouterParams.releasePlanName}`,
        loader: releasePlanTriggerLoader,
        errorElement: <RouteErrorBoundry />,
        element: <TriggerReleaseFormPage />,
      },
      /* Create Release plan */
      {
        path: `workspaces/:${RouterParams.workspaceName}/release/release-plan/edit/:${RouterParams.releasePlanName}`,
        loader: releasePlanEditFormLoader,
        errorElement: <RouteErrorBoundry />,
        element: <ReleasePlanEditFormPage />,
      },
      /* Edit Release plan */
      {
        path: `workspaces/:${RouterParams.workspaceName}/release/release-plan/create`,
        loader: releasePlanCreateFormLoader,
        errorElement: <RouteErrorBoundry />,
        element: <ReleasePlanCreateFormPage />,
      },
      /* Release service list view */
      {
        path: `workspaces/:${RouterParams.workspaceName}/release`,
        element: <ReleaseService />,
        errorElement: <RouteErrorBoundry />,
        children: [
          {
            index: true,
            loader: releasePlanListLoader,
            element: <ReleasePlanListView />,
            errorElement: <RouteErrorBoundry />,
          },
          {
            path: 'release-plan',
            loader: releasePlanListLoader,
            element: <ReleasePlanListView />,
            errorElement: <RouteErrorBoundry />,
          },
          {
            path: 'release-plan-admission',
            loader: releasePlanAdmissionListLoader,
            element: <ReleasePlanAdmissionListView />,
            errorElement: <RouteErrorBoundry />,
          },
        ],
      },
      /* Snapshot Details view */
      {
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/snapshots/:${RouterParams.snapshotName}`,
        loader: snapshotDetailsViewLoader,
        element: <SnapshotDetailsView />,
        errorElement: <RouteErrorBoundry />,
        children: [
          {
            index: true,
            element: <SnapshotOverviewTab />,
            errorElement: <RouteErrorBoundry />,
          },
          {
            path: 'pipelineruns',
            element: <SnapshotPipelineRunsTab />,
            errorElement: <RouteErrorBoundry />,
          },
        ],
      },
      /* User Acess routes */
      {
        path: `workspaces/:${RouterParams.workspaceName}/access/grant`,
        loader: grantAccessPageLoader,
        element: <GrantAccessPage />,
        errorElement: <RouteErrorBoundry />,
      },
      {
        path: `workspaces/:${RouterParams.workspaceName}/access/edit/:${RouterParams.bindingName}`,
        element: <GrantAccessPage />,
        errorElement: <RouteErrorBoundry />,
      },
      {
        path: `workspaces/:${RouterParams.workspaceName}/access`,
        element: <UserAccessListPage />,
        errorElement: <RouteErrorBoundry />,
        loader: userAccessListPageLoader,
      },
      // '/ns/:ns',
      //   '/ns/:ns/pipelinerun/:pipelineRun',
      //   '/ns/:ns/pipelinerun/:pipelineRun/logs',
      //   '/ns/:ns/pipelinerun/:pipelineRun/logs/:task',
      /* Github Redirects */
      {
        path: `/ns/:${GithubRedirectRouteParams.ns}/pipelinerun?/:${GithubRedirectRouteParams.pipelineRunName}?/logs?/:${GithubRedirectRouteParams.taskName}?`,
        element: <GithubRedirect />,
        loader: githubRedirectLoader,
        errorElement: <RouteErrorBoundry />,
      },
    ],
  },
  {
    path: '*',
    element: <ErrorEmptyState httpError={HttpError.fromCode(404)} />,
  },
]);
