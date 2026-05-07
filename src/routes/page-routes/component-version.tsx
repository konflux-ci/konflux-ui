import { COMPONENT_VERSION_DETAILS_PATH } from '@routes/paths';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import { RouterParams } from '@routes/utils';
import {
  ComponentVersionDetailsViewLayout,
  componentVersionDetailsViewLoader,
} from '~/components/ComponentVersion';
import ComponentVersionDetailsTab from '~/components/ComponentVersion/tabs/ComponentVersionDetailsTab';
import { ActivityTabV2 } from '~/shared/components/activity-tab/ActivityTabV2';

const componentVersionRoutes = [
  {
    path: COMPONENT_VERSION_DETAILS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    loader: componentVersionDetailsViewLoader,
    element: <ComponentVersionDetailsViewLayout />,
    children: [
      {
        index: true,
        element: <ComponentVersionDetailsTab />,
      },
      {
        path: `activity/:${RouterParams.activityTab}`,
        element: <ActivityTabV2 />,
      },
      {
        path: 'activity',
        element: <ActivityTabV2 />,
      },
    ],
  },
];

export default componentVersionRoutes;
