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
  PipelineRunDetailsLayout,
  PipelineRunDetailsLogsTab,
  PipelineRunDetailsTab,
  pipelineRunDetailsViewLoader,
  PipelineRunSecurityEnterpriseContractTab,
  PipelineRunTaskRunsTab,
} from '../components/PipelineRun/PipelineRunDetailsView';
import { ReleaseListViewTab, releaseListViewTabLoader } from '../components/Releases';
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
  EditAccessPage,
  UserAccessListPage,
  userAccessListPageLoader,
} from '../components/UserAccess';
import { HttpError } from '../k8s/error';
import ErrorEmptyState from '../shared/components/empty-state/ErrorEmptyState';
import { namespaceLoader, NamespaceProvider } from '../shared/providers/Namespace';
import applicationRoutes from './page-routes/application';
import componentRoutes from './page-routes/components';
import integrationTestRoutes from './page-routes/integration-test';
import workspaceRoutes from './page-routes/namespace';
import releaseRoutes from './page-routes/release';
import releaseServiceRoutes from './page-routes/release-service';
import secretRoutes from './page-routes/secrets';
import snapshotRoutes from './page-routes/snapshots';
import { RouteErrorBoundry } from './RouteErrorBoundary';
import { GithubRedirectRouteParams, RouterParams } from './utils';

export const router = createBrowserRouter([
  {
    path: '/',
    loader: async (params) => {
      return await namespaceLoader(params);
    },
    errorElement: <RouteErrorBoundry />,
    element: (
      <NamespaceProvider>
        <ModalProvider>
          <AppRoot />
        </ModalProvider>
      </NamespaceProvider>
    ),
    children: [
      {
        index: true,
        element: <Overview />,
      },
      ...workspaceRoutes,
      ...applicationRoutes,
      ...componentRoutes,
      ...releaseRoutes,
      ...releaseServiceRoutes,
      ...secretRoutes,
      ...integrationTestRoutes,
      ...snapshotRoutes,
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
      /* User Acess routes */
      {
        path: `workspaces/:${RouterParams.workspaceName}/access/grant`,
        loader: grantAccessPageLoader,
        element: <GrantAccessPage />,
        errorElement: <RouteErrorBoundry />,
      },
      {
        // Permission check has been covered in the EditAccessPage itself.
        path: `/workspaces/:${RouterParams.workspaceName}/access/edit/:${RouterParams.bindingName}`,
        element: <EditAccessPage />,
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
