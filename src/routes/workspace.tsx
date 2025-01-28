import { importPageLoader, ImportForm } from '../components/ImportForm';
import { RouteErrorBoundry } from './RouteErrorBoundary';
import { buildRoute, RouterParams } from './utils';

export const WORKSPACE_PATH = buildRoute(`workspaces/:${RouterParams.workspaceName}`);

const IMPORT_PATH = WORKSPACE_PATH.extend('import');

const workspaceRoutes = [
  {
    path: IMPORT_PATH.path,
    loader: importPageLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ImportForm />,
  },
];

export default workspaceRoutes;
