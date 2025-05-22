import {
  ComponentActivityTab,
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
  componentDetailsViewLoader,
} from '../../components/Components/ComponentDetails';
import { linkedSecretsListViewLoader } from '../../components/Components/LinkedSecretsListView';
import { LinkedSecretsListView } from '../../components/Components/LinkedSecretsListView/LinkedSecretsListView';
import { COMPONENT_DETAILS_PATH, COMPONENT_LINKED_SECRETS_PATH } from '../paths';
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
  {
    path: COMPONENT_LINKED_SECRETS_PATH.path,
    element: <LinkedSecretsListView />,
    loader: linkedSecretsListViewLoader,
    errorElement: <RouteErrorBoundry />,
  },
];

export default componentRoutes;
