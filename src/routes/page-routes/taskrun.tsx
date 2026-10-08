import NamespaceTaskRunDetailsView from '~/components/TaskRunDetailsView/NamespaceTaskRunDetailsView';
import NamespaceTaskRunDetailsTab from '~/components/TaskRunDetailsView/tabs/NamespaceTaskRunDetailsTab';
import {
  TaskRunDetailsTab,
  TaskRunDetailsViewLayout,
  taskRunDetailsViewLoader,
  TaskRunLogsTab,
  TaskRunSecurityTab,
  TaskRunVulnerabilitiesTab,
} from '../../components/TaskRunDetailsView';
import { TASKRUN_DETAILS_PATH, NAMESPACE_TASK_RUN_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const taskRunRoutes = [
  {
    path: NAMESPACE_TASK_RUN_DETAILS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    loader: taskRunDetailsViewLoader,
    element: <NamespaceTaskRunDetailsView />,
    children: [
      { index: true, element: <NamespaceTaskRunDetailsTab /> },
      { path: 'logs', element: <TaskRunLogsTab /> },
    ],
  },
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
