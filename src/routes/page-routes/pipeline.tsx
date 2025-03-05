import {
  PipelineRunDetailsLayout,
  PipelineRunDetailsLogsTab,
  PipelineRunDetailsTab,
  pipelineRunDetailsViewLoader,
  PipelineRunSecurityEnterpriseContractTab,
  PipelineRunTaskRunsTab,
} from '../../components/PipelineRun/PipelineRunDetailsView';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import { RouterParams } from '../utils';

const pipelineRoutes = [
  /* Pipeline Run details routes */
  {
    path: `workspaces/:${RouterParams.workspaceName}/applications/:${RouterParams.applicationName}/pipelineruns/:${RouterParams.pipelineRunName}`,
    errorElement: <RouteErrorBoundry />,
    loader: pipelineRunDetailsViewLoader,
    element: <PipelineRunDetailsLayout />,
    children: [
      { index: true, element: <PipelineRunDetailsTab /> },
      { path: 'taskruns', element: <PipelineRunTaskRunsTab /> },
      { path: 'logs', element: <PipelineRunDetailsLogsTab /> },
      { path: 'security', element: <PipelineRunSecurityEnterpriseContractTab /> },
    ],
  },
];
export default pipelineRoutes;
