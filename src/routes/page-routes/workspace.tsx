import { importPageLoader, ImportForm } from '../../components/ImportForm';
import { IMPORT_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const workspaceRoutes = [
  {
    path: IMPORT_PATH.path,
    loader: importPageLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ImportForm />,
  },
];

export default workspaceRoutes;
