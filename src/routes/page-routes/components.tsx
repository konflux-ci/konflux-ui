import {
  ComponentActivityTab,
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
  componentDetailsViewLoader,
} from '../../components/Components/ComponentDetails';
import { COMPONENT_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import { RouterParams } from '../utils';

const componentRoutes = [
  {
    path: COMPONENT_DETAILS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    loader: componentDetailsViewLoader,
    element: <ComponentDetailsViewLayout />,
    children: [
      {
        index: true,
        element: <ComponentDetailsTab />,
      },
      {
        path: `activity/:${RouterParams.activityTab}`,
        element: <ComponentActivityTab />,
      },
      {
        path: `activity`,
        element: <ComponentActivityTab />,
      },
    ],
  },
];

export default componentRoutes;
