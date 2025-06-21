import { RouteErrorBoundry } from '..//RouteErrorBoundary';
import { SNAPSHOT_DETAILS_PATH } from '../paths';
import {
  SnapshotDetailsView,
  snapshotDetailsViewLoader,
  SnapshotOverviewTab,
  SnapshotPipelineRunsTab,
} from '~/components/SnapshotDetails';

const snapshotRoutes = [
  {
    path: SNAPSHOT_DETAILS_PATH.path,
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
];

export default snapshotRoutes;
