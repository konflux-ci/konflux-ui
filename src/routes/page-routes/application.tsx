import { applicationPageLoader, ApplicationListView } from '../../components/Applications';
import { APPLICATION_LIST_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const applicationRoutes = [
  {
    path: APPLICATION_LIST_PATH.path,
    loader: applicationPageLoader,
    element: <ApplicationListView />,
    errorElement: <RouteErrorBoundry />,
  },
];

export default applicationRoutes;
