import { importPageLoader, ImportForm } from '../../components/ImportForm';
import { IMPORT_PATH, RELEASE_MONITOR_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const releaseMonitorRoutes = [
  {
    path: RELEASE_MONITOR_PATH.path,
    errorElement: <RouteErrorBoundry />,
    async lazy() {
      const { ReleaseMonitor } = await import('../../components/ReleaseMonitor');
      return { element: <ReleaseMonitor /> };
    },
  },
  {
    path: IMPORT_PATH.path,
    loader: importPageLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ImportForm />,
  },
];

export default releaseMonitorRoutes;
