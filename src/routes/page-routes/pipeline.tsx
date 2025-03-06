import {
  PipelineRunDetailsLayout,
  PipelineRunDetailsLogsTab,
  PipelineRunDetailsTab,
  pipelineRunDetailsViewLoader,
  PipelineRunSecurityEnterpriseContractTab,
  PipelineRunTaskRunsTab,
} from '../../components/PipelineRun/PipelineRunDetailsView';
import { PIPELINE_RUNS_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';
import { RouterParams } from '../utils';

const pipelineRoutes = [
  /* Pipeline Run details routes */
  {
    path: PIPELINE_RUNS_DETAILS_PATH.createPath({
      workspaceName: `:${RouterParams.workspaceName}`,
      applicationName: `:${RouterParams.applicationName}`,
      pipelineRunName: `:${RouterParams.pipelineRunName}`,
    }),

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
