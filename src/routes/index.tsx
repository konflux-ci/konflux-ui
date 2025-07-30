import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '../AppRoot/AppRoot';
import { GithubRedirect, githubRedirectLoader } from '../components/GithubRedirect';
import { ModalProvider } from '../components/modal/ModalProvider';
import { Overview } from '../components/Overview/Overview';
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
import releaseMonitorRoutes from './page-routes/release-monitor';
import releaseServiceRoutes from './page-routes/release-service';
import secretRoutes from './page-routes/secrets';
import snapshotRoutes from './page-routes/snapshots';
import taskRunRoutes from './page-routes/taskrun';
import userAccessRoutes from './page-routes/user-access';
import { RouteErrorBoundry } from './RouteErrorBoundary';
import { GithubRedirectRouteParams } from './utils';

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
      ...releaseMonitorRoutes,
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
      ...userAccessRoutes,
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
