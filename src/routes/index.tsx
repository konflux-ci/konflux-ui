import { createBrowserRouter } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
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
import taskRunRoutes from './page-routes/taskrun';
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
      ...taskRunRoutes,
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
            element: (
              <FilterContextProvider filterParams={['name']}>
                <IntegrationTestsListView />
              </FilterContextProvider>
            ),
          },
          {
            path: 'releases',
            loader: releaseListViewTabLoader,
            errorElement: <RouteErrorBoundry />,
            element: (
              <FilterContextProvider filterParams={['name', 'release plan', 'release snapshot']}>
                <ReleaseListViewTab />
              </FilterContextProvider>
            ),
          },
        ],
      },
      /* User Acess routes */
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
