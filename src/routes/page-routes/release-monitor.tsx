import { RELEASE_MONITOR_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const releaseMonitorRoutes = [
  {
    path: RELEASE_MONITOR_PATH.path,
    errorElement: <RouteErrorBoundry />,
    async lazy() {
      const { ReleaseMonitor } = await import(
        '../../components/ReleaseMonitor' /* webpackChunkName: "release-monitor" */
      );
      return { element: <ReleaseMonitor /> };
    },
  },
];

export default releaseMonitorRoutes;
