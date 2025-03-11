import {
  ReleaseDetailsLayout,
  releaseListViewTabLoader,
  ReleaseOverviewTab,
} from '../../components/Releases';
import { APPLICATION_RELEASE_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const releaseRoutes = [
  // details page
  {
    path: APPLICATION_RELEASE_DETAILS_PATH.path,
    loader: releaseListViewTabLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ReleaseDetailsLayout />,
    children: [
      {
        index: true,
        element: <ReleaseOverviewTab />,
      },
    ],
  },
];

export default releaseRoutes;
