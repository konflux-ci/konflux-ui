import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '../AppRoot/AppRoot';
import { ActivityTab } from '../components/Activity';
import { ApplicationDetails, ApplicationOverviewTab } from '../components/ApplicationDetails';
import { ComponentListTab, componentsTabLoader } from '../components/Components/ComponentsListView';
import { GithubRedirect, githubRedirectLoader } from '../components/GithubRedirect';
import {
  integrationListPageLoader,
  IntegrationTestsListView,
} from '../components/IntegrationTests/IntegrationTestsListView';
import { ModalProvider } from '../components/modal/ModalProvider';
import { Overview } from '../components/Overview/Overview';
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
import commitRoutes from './page-routes/commit';
import componentRoutes from './page-routes/components';
import integrationTestRoutes from './page-routes/integration-test';
import workspaceRoutes from './page-routes/namespace';
import pipelineRoutes from './page-routes/pipeline';
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
      ...commitRoutes,
      ...pipelineRoutes,
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
      /* Trigger Release plan */

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
