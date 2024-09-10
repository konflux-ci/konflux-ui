import { createBrowserRouter } from 'react-router-dom';
import { AppRoot } from '../AppRoot/AppRoot';
import { applicationPageLoader } from '../components/Applications';
import ApplicationListView from '../components/Applications/ApplicationListView';
import { importPageLoader, ImportForm } from '../components/ImportForm';
import { Overview } from '../components/Overview/Overview';
import { queryWorkspaces } from '../components/Workspace/utils';
import { WorkspaceProvider } from '../components/Workspace/workspace-context';
import { RouteErrorBoundry } from './RouteErrorBoundary';
import { RouterParams } from './utils';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      loader: async () => {
        const workspaces = await queryWorkspaces();
        return { data: workspaces };
      },
      element: (
        <WorkspaceProvider>
          <AppRoot />
        </WorkspaceProvider>
      ),
      children: [
        {
          index: true,
          element: <Overview />,
        },
        {
          path: `/workspaces/:${RouterParams.workspaceName}/import`,
          loader: importPageLoader,
          errorElement: <RouteErrorBoundry />,
          element: <ImportForm applicationName={undefined} />,
        },
        {
          path: `/workspaces/:${RouterParams.workspaceName}/applications`,
          loader: applicationPageLoader,
          element: <ApplicationListView />,
          errorElement: <RouteErrorBoundry />,
        },
      ],
    },
  ],
  { basename: '/' },
);
