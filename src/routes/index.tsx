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
  integrationListPageLoader,
  IntegrationTestsListView,
} from '../components/IntegrationTests/IntegrationTestsListView';
import { ModalProvider } from '../components/modal/ModalProvider';
import { Overview } from '../components/Overview/Overview';
import {
  ReleaseDetailsLayout,
  releaseDetailsViewLoader,
  ReleaseListViewTab,
  releaseListViewTabLoader,
  ReleaseOverviewTab,
} from '../components/Releases';
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
      /* Component details route */
      {
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/components/:${RouterParams.componentName}`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { ComponentDetailsViewLayout, componentDetailsViewLoader } = await import(
            '../components/Components/ComponentDetails'
          );
          return { Component: ComponentDetailsViewLayout, loader: componentDetailsViewLoader };
        },
        children: [
          {
            index: true,
            async lazy() {
              const { ComponentDetailsTab } = await import(
                '../components/Components/ComponentDetails'
              );
              return { Component: ComponentDetailsTab };
            },
          },
          {
            path: `activity/:${RouterParams.activityTab}`,
            async lazy() {
              const { ComponentActivityTab } = await import(
                '../components/Components/ComponentDetails'
              );
              return { Component: ComponentActivityTab };
            },
          },
          {
            path: `activity`,
            async lazy() {
              const { ComponentActivityTab } = await import(
                '../components/Components/ComponentDetails'
              );
              return { Component: ComponentActivityTab };
            },
          },
        ],
      },
      /* IntegrationTestScenario routes */
      {
        // create form
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/add`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { IntegrationTestCreateForm, integrationTestCreateFormLoader } = await import(
            '../components/IntegrationTests/IntegrationTestForm'
          );
          return { Component: IntegrationTestCreateForm, loader: integrationTestCreateFormLoader };
        },
      },
      /* Integration test edit form */
      {
        // edit form
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/:${RouterParams.integrationTestName}/edit`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { IntegrationTestEditForm, integrationTestEditFormLoader } = await import(
            '../components/IntegrationTests/IntegrationTestForm'
          );
          return { Component: IntegrationTestEditForm, loader: integrationTestEditFormLoader };
        },
      },
      /* Integration tests Details routes */
      {
        // details page
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/integrationtests/:${RouterParams.integrationTestName}`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { IntegrationTestDetailsView, integrationDetailsPageLoader } = await import(
            '../components/IntegrationTests/IntegrationTestDetails'
          );
          return { Component: IntegrationTestDetailsView, loader: integrationDetailsPageLoader };
        },
        children: [
          {
            index: true,
            async lazy() {
              const { IntegrationTestOverviewTab } = await import(
                '../components/IntegrationTests/IntegrationTestDetails'
              );
              return { Component: IntegrationTestOverviewTab };
            },
          },
          {
            path: 'pipelineruns',
            async lazy() {
              const { IntegrationTestPipelineRunTab } = await import(
                '../components/IntegrationTests/IntegrationTestDetails'
              );
              return { Component: IntegrationTestPipelineRunTab };
            },
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
        async lazy() {
          const { PipelineRunDetailsTab, pipelineRunDetailsViewLoader } = await import(
            '../components/PipelineRun/PipelineRunDetailsView'
          );
          return { Component: PipelineRunDetailsTab, loader: pipelineRunDetailsViewLoader };
        },
        children: [
          {
            index: true,
            async lazy() {
              const { PipelineRunDetailsTab } = await import(
                '../components/PipelineRun/PipelineRunDetailsView'
              );
              return { Component: PipelineRunDetailsTab };
            },
          },
          {
            path: 'taskruns',
            async lazy() {
              const { PipelineRunTaskRunsTab } = await import(
                '../components/PipelineRun/PipelineRunDetailsView'
              );
              return { Component: PipelineRunTaskRunsTab };
            },
          },
          {
            path: 'logs',
            async lazy() {
              const { PipelineRunDetailsLogsTab } = await import(
                '../components/PipelineRun/PipelineRunDetailsView'
              );
              return { Component: PipelineRunDetailsLogsTab };
            },
          },
          {
            path: 'security',
            async lazy() {
              const { PipelineRunSecurityEnterpriseContractTab } = await import(
                '../components/PipelineRun/PipelineRunDetailsView'
              );
              return { Component: PipelineRunSecurityEnterpriseContractTab };
            },
          },
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
        path: `/workspaces/:workspaceName/secrets/create`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { AddSecretForm } = await import('../components/Secrets');
          return { Component: AddSecretForm };
        },
      },
      /* Secrets list view */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/secrets`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { SecretsListPage, secretListViewLoader } = await import('../components/Secrets');
          return { loader: secretListViewLoader, Component: SecretsListPage };
        },
      },
      /* Trigger Release plan */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/release/release-plan/trigger/:${RouterParams.releasePlanName}`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { TriggerReleaseFormPage, releasePlanTriggerLoader } = await import(
            '../components/ReleaseService'
          );
          return { Component: TriggerReleaseFormPage, loader: releasePlanTriggerLoader };
        },
      },
      /* Create Release plan */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/release/release-plan/edit/:${RouterParams.releasePlanName}`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { ReleasePlanEditFormPage, releasePlanEditFormLoader } = await import(
            '../components/ReleaseService'
          );
          return { Component: ReleasePlanEditFormPage, loader: releasePlanEditFormLoader };
        },
      },
      /* Edit Release plan */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/release/release-plan/create`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { ReleasePlanCreateFormPage, releasePlanCreateFormLoader } = await import(
            '../components/ReleaseService'
          );
          return { Component: ReleasePlanCreateFormPage, loader: releasePlanCreateFormLoader };
        },
      },
      /* Release service list view */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/release`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { ReleaseService } = await import('../components/ReleaseService');
          return { Component: ReleaseService };
        },
        children: [
          {
            index: true,
            errorElement: <RouteErrorBoundry />,
            async lazy() {
              const { ReleasePlanListView, releasePlanListLoader } = await import(
                '../components/ReleaseService'
              );
              return { Component: ReleasePlanListView, loader: releasePlanListLoader };
            },
          },
          {
            path: 'release-plan',
            errorElement: <RouteErrorBoundry />,
            async lazy() {
              const { ReleasePlanListView, releasePlanListLoader } = await import(
                '../components/ReleaseService'
              );
              return { Component: ReleasePlanListView, loader: releasePlanListLoader };
            },
          },
          {
            path: 'release-plan-admission',
            errorElement: <RouteErrorBoundry />,
            async lazy() {
              const { ReleasePlanAdmissionListView, releasePlanAdmissionListLoader } = await import(
                '../components/ReleaseService'
              );
              return {
                Component: ReleasePlanAdmissionListView,
                loader: releasePlanAdmissionListLoader,
              };
            },
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
