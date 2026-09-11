import {
  TaskRunDetailsTab,
  TaskRunDetailsViewLayout,
  taskRunDetailsViewLoader,
  TaskRunLogsTab,
  TaskRunSecurityTab,
  TaskRunVulnerabilitiesTab,
} from '../../components/TaskRunDetailsView';
import { TASKRUN_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const taskRunRoutes = [
  {
    path: TASKRUN_DETAILS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    loader: taskRunDetailsViewLoader,
    element: <TaskRunDetailsViewLayout />,
    children: [
      { index: true, element: <TaskRunDetailsTab /> },
      { path: 'logs', element: <TaskRunLogsTab /> },
      { path: 'security', element: <TaskRunSecurityTab /> },
      { path: 'vulnerabilities', element: <TaskRunVulnerabilitiesTab /> },
    ],
  },
];

export default taskRunRoutes;
