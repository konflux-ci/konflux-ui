import {
  AddSecretForm,
  EditSecretForm,
  SecretsListPage,
  secretListViewLoader,
} from '../../components/Secrets';
import { SECRET_LIST_PATH, SECRET_CREATE_PATH, SECRET_EDIT_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const secretRoutes = [
  /* Secrets create form */
  {
    path: SECRET_CREATE_PATH.path,
    element: <AddSecretForm />,
    errorElement: <RouteErrorBoundry />,
  },
  /* Secrets edit form */
  {
    path: SECRET_EDIT_PATH.path,
    element: <EditSecretForm />,
    errorElement: <RouteErrorBoundry />,
  },
  /* Secrets list view */
  {
    path: SECRET_LIST_PATH.path,
    loader: secretListViewLoader,
    element: <SecretsListPage />,
    errorElement: <RouteErrorBoundry />,
  },
];

export default secretRoutes;
