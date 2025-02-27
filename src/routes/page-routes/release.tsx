import { releaseListViewTabLoader } from '../../components/Releases';
import ReleasesListView from '../../components/Releases/ReleasesListView';
import { APPLICATION_RELEASE_LIST_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const releaseRoutes = [
  {
    path: APPLICATION_RELEASE_LIST_PATH.path,
    loader: releaseListViewTabLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ReleasesListView />,
  },
];

export default releaseRoutes;
