import {
  integrationDetailsPageLoader,
  IntegrationTestDetailsView,
  IntegrationTestOverviewTab,
  IntegrationTestPipelineRunTab,
} from '../../components/IntegrationTests/IntegrationTestDetails';
import {
  IntegrationTestCreateForm,
  integrationTestCreateFormLoader,
  IntegrationTestEditForm,
  integrationTestEditFormLoader,
} from '../../components/IntegrationTests/IntegrationTestForm';
import {
  INTEGRATION_TEST_ADD_PATH,
  INTEGRATION_TEST_DETAILS_PATH,
  INTEGRATION_TEST_EDIT_PATH,
} from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const integrationTestRoutes = [
  {
    // create form
    path: INTEGRATION_TEST_ADD_PATH.path,
    loader: integrationTestCreateFormLoader,
    errorElement: <RouteErrorBoundry />,
    element: <IntegrationTestCreateForm />,
  },
  /* Integration test edit form */
  {
    // edit form
    path: INTEGRATION_TEST_EDIT_PATH.path,
    loader: integrationTestEditFormLoader,
    errorElement: <RouteErrorBoundry />,
    element: <IntegrationTestEditForm />,
  },
  /* Integration tests Details routes */
  {
    // details page
    path: INTEGRATION_TEST_DETAILS_PATH.path,
    loader: integrationDetailsPageLoader,
    errorElement: <RouteErrorBoundry />,
    element: <IntegrationTestDetailsView />,
    children: [
      {
        index: true,
        element: <IntegrationTestOverviewTab />,
      },
      {
        path: 'pipelineruns',
        element: <IntegrationTestPipelineRunTab />,
      },
    ],
  },
];

export default integrationTestRoutes;
