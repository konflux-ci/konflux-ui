import { applicationPageLoader, ApplicationListView } from '../../components/Applications';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import { RouterParams } from '../utils';
import { WORKSPACE_PATH } from './workspace';

export const APPLICATION_LIST_PATH = WORKSPACE_PATH.extend(`applications`);

export const APPLICATION_DETAILS_PATH = APPLICATION_LIST_PATH.extend(
  `:${RouterParams.applicationName}`,
);

const applicationPath = [
  {
    path: APPLICATION_LIST_PATH.path,
    loader: applicationPageLoader,
    element: <ApplicationListView />,
    errorElement: <RouteErrorBoundry />,
  },
];

export default applicationPath;
