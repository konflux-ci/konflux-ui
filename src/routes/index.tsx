import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '../AppRoot/AppRoot';
import { ModalProvider } from '../components/modal/ModalProvider';
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
        async lazy() {
          const { Overview } = await import('../components/Overview/Overview');
          return { Component: Overview };
        },
      },
      ...applicationRoutes,
      ...workspaceRoutes,

      /* Application details */
      {
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}`,
        element: <ApplicationDetails />,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { ApplicationDetails } = await import('../components/ApplicationDetails');
          return { Component: ApplicationDetails };
        },
        children: [
          {
            index: true,
            async lazy() {
              const { ApplicationOverviewTab } = await import('../components/ApplicationDetails');
              return { Component: ApplicationOverviewTab };
            },
          },
          {
            path: `activity/:${RouterParams.activityTab}`,
            async lazy() {
              const { ActivityTab } = await import('../components/Activity');
              return { Component: ActivityTab };
            },
          },
          {
            path: `activity`,
            async lazy() {
              const { ActivityTab } = await import('../components/Activity');
              return { Component: ActivityTab };
            },
          },
          {
            path: 'components',
            errorElement: <RouteErrorBoundry />,
            async lazy() {
              const { ComponentListTab, componentsTabLoader } = await import(
                '../components/Components/ComponentsListView'
              );
              return { Component: ComponentListTab, loader: componentsTabLoader };
            },
          },
          {
            path: 'integrationtests',
            errorElement: <RouteErrorBoundry />,
            async lazy() {
              const { IntegrationTestsListView, integrationListPageLoader } = await import(
                '../components/IntegrationTests/IntegrationTestsListView'
              );
              return { Component: IntegrationTestsListView, loader: integrationListPageLoader };
            },
          },
          {
            path: 'releases',
            errorElement: <RouteErrorBoundry />,
            async lazy() {
              const { ReleaseListViewTab, releaseListViewTabLoader } = await import(
                '../components/Releases'
              );
              return { Component: ReleaseListViewTab, loader: releaseListViewTabLoader };
            },
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
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/releases/:${RouterParams.releaseName}`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { ReleaseDetailsLayout, releaseDetailsViewLoader } = await import(
            '../components/Releases'
          );
          return { Component: ReleaseDetailsLayout, loader: releaseDetailsViewLoader };
        },
        children: [
          {
            index: true,
            async lazy() {
              const { ReleaseOverviewTab } = await import('../components/Releases');
              return { Component: ReleaseOverviewTab };
            },
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
        async lazy() {
          const { TaskRunDetailsViewLayout, taskRunDetailsViewLoader } = await import(
            '../components/TaskRunDetailsView'
          );
          return { Component: TaskRunDetailsViewLayout, loader: taskRunDetailsViewLoader };
        },
        children: [
          {
            index: true,
            async lazy() {
              const { TaskRunDetailsTab } = await import('../components/TaskRunDetailsView');
              return { Component: TaskRunDetailsTab };
            },
          },
          {
            path: 'logs',
            async lazy() {
              const { TaskRunLogsTab } = await import('../components/TaskRunDetailsView');
              return { Component: TaskRunLogsTab };
            },
          },
          {
            path: 'security',
            async lazy() {
              const { TaskrunSecurityEnterpriseContractTab } = await import(
                '../components/TaskRunDetailsView'
              );
              return { Component: TaskrunSecurityEnterpriseContractTab };
            },
          },
        ],
      },
      /* Commit list view */
      {
        path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/commit/:${RouterParams.commitName}`,
        errorElement: <RouteErrorBoundry />,
        // element: <CommitDetailsView />,
        async lazy() {
          const { CommitDetailsView } = await import('../components/Commits/CommitDetails');
          return { Component: CommitDetailsView };
        },
        children: [
          {
            index: true,
            // element: <CommitOverviewTab />
            async lazy() {
              const { CommitOverviewTab } = await import('../components/Commits/CommitDetails');
              return { Component: CommitOverviewTab };
            },
          },
          {
            path: 'pipelineruns',
            // element: <CommitsPipelineRunTab />
            async lazy() {
              const { CommitsPipelineRunTab } = await import('../components/Commits/CommitDetails');
              return { Component: CommitsPipelineRunTab };
            },
          },
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
        path: `/workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/snapshots/:${RouterParams.snapshotName}`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { SnapshotDetailsView, snapshotDetailsViewLoader } = await import(
            '../components/SnapshotDetails'
          );
          return { Component: SnapshotDetailsView, loader: snapshotDetailsViewLoader };
        },
        children: [
          {
            index: true,
            errorElement: <RouteErrorBoundry />,
            async lazy() {
              const { SnapshotOverviewTab } = await import('../components/SnapshotDetails');
              return { Component: SnapshotOverviewTab };
            },
          },
          {
            path: 'pipelineruns',
            errorElement: <RouteErrorBoundry />,
            async lazy() {
              const { SnapshotPipelineRunsTab } = await import('../components/SnapshotDetails');
              return { Component: SnapshotPipelineRunsTab };
            },
          },
        ],
      },
      /* User Acess routes */
      {
        path: `/workspaces/:${RouterParams.workspaceName}/access/grant`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { GrantAccessPage, grantAccessPageLoader } = await import(
            '../components/UserAccess'
          );
          return { Component: GrantAccessPage, loader: grantAccessPageLoader };
        },
      },
      {
        path: `/workspaces/:${RouterParams.workspaceName}/access/edit/:${RouterParams.bindingName}`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { GrantAccessPage } = await import('../components/UserAccess');
          return { Component: GrantAccessPage };
        },
      },
      {
        path: `/workspaces/:${RouterParams.workspaceName}/access`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { UserAccessListPage, userAccessListPageLoader } = await import(
            '../components/UserAccess'
          );
          return { Component: UserAccessListPage, loader: userAccessListPageLoader };
        },
      },
      // '/ns/:ns',
      //   '/ns/:ns/pipelinerun/:pipelineRun',
      //   '/ns/:ns/pipelinerun/:pipelineRun/logs',
      //   '/ns/:ns/pipelinerun/:pipelineRun/logs/:task',
      /* Github Redirects */
      {
        path: `/ns/:${GithubRedirectRouteParams.ns}/pipelinerun?/:${GithubRedirectRouteParams.pipelineRunName}?/logs?/:${GithubRedirectRouteParams.taskName}?`,
        errorElement: <RouteErrorBoundry />,
        async lazy() {
          const { GithubRedirect, githubRedirectLoader } = await import(
            '../components/GithubRedirect'
          );
          return { Component: GithubRedirect, loader: githubRedirectLoader };
        },
      },
    ],
  },
  {
    path: '*',
    element: <ErrorEmptyState httpError={HttpError.fromCode(404)} />,
  },
]);
