import {
  releasePlanAdmissionListLoader,
  ReleasePlanAdmissionListView,
  releasePlanCreateFormLoader,
  ReleasePlanCreateFormPage,
  releasePlanEditFormLoader,
  ReleasePlanEditFormPage,
  releasePlanListLoader,
  ReleasePlanListView,
  releasePlanTriggerLoader,
  ReleaseService,
  TriggerReleaseFormPage,
} from '../../components/ReleaseService';
import {
  RELEASE_SERVICE_PATH,
  RELEASEPLAN_CREATE_PATH,
  RELEASEPLAN_EDIT_PATH,
  RELEASEPLAN_TRIGGER_PATH,
} from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const releaseServiceRoutes = [
  {
    path: RELEASEPLAN_TRIGGER_PATH.path,
    loader: releasePlanTriggerLoader,
    errorElement: <RouteErrorBoundry />,
    element: <TriggerReleaseFormPage />,
  },
  /* Edit Release plan */
  {
    path: RELEASEPLAN_EDIT_PATH.path,
    loader: releasePlanEditFormLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ReleasePlanEditFormPage />,
  },
  /* Create Release plan */
  {
    path: RELEASEPLAN_CREATE_PATH.path,
    loader: releasePlanCreateFormLoader,
    errorElement: <RouteErrorBoundry />,
    element: <ReleasePlanCreateFormPage />,
  },
  /* Release service list view */
  {
    path: RELEASE_SERVICE_PATH.path,
    element: <ReleaseService />,
    errorElement: <RouteErrorBoundry />,
    children: [
      {
        index: true,
        loader: releasePlanListLoader,
        element: <ReleasePlanListView />,
        errorElement: <RouteErrorBoundry />,
      },
      {
        path: 'release-plan',
        loader: releasePlanListLoader,
        element: <ReleasePlanListView />,
        errorElement: <RouteErrorBoundry />,
      },
      {
        path: 'release-plan-admission',
        loader: releasePlanAdmissionListLoader,
        element: <ReleasePlanAdmissionListView />,
        errorElement: <RouteErrorBoundry />,
      },
    ],
  },
];

export default releaseServiceRoutes;
