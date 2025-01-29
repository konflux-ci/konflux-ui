import { importPageLoader, ImportForm } from '../../components/ImportForm';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import { buildRoute, RouterParams } from '../utils';
import type { RouteDefinition } from '../utils';

type WorkspacePath = `workspaces/:${typeof RouterParams.workspaceName}`;

export const WORKSPACE_PATH: RouteDefinition<WorkspacePath> = buildRoute(
  `workspaces/:${RouterParams.workspaceName}`,
);

export const IMPORT_PATH = WORKSPACE_PATH.extend('import');

const workspaceRoutes = [
  {
    path: IMPORT_PATH.path,
    loader: importPageLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ImportForm />,
  },
];

export default workspaceRoutes;
