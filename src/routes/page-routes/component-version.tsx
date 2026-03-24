import { COMPONENT_VERSION_DETAILS_PATH } from '@routes/paths';
import { RouteErrorBoundry } from '@routes/RouteErrorBoundary';
import {
  ComponentVersionDetailsViewLayout,
  componentVersionDetailsViewLoader,
} from '~/components/ComponentVersion';
import ComponentVersionDetailsTab from '~/components/ComponentVersion/tabs/ComponentVersionDetailsTab';

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
        path: 'activity',
        element: null, // TODO: implement Version Activity tab
      },
    ],
  },
];

export default componentVersionRoutes;
