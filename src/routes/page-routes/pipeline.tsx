import {
  PipelineRunDetailsLayout,
  PipelineRunDetailsLogsTab,
  PipelineRunDetailsTab,
  pipelineRunDetailsViewLoader,
  PipelineRunSecurityTab,
  PipelineRunTaskRunsTab,
} from '../../components/PipelineRun/PipelineRunDetailsView';
import { PIPELINE_RUNS_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const pipelineRoutes = [
  /* Pipeline Run details routes */
  {
    path: PIPELINE_RUNS_DETAILS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    loader: pipelineRunDetailsViewLoader,
    element: <PipelineRunDetailsLayout />,
    children: [
      { index: true, element: <PipelineRunDetailsTab /> },
      { path: 'taskruns', element: <PipelineRunTaskRunsTab /> },
      { path: 'logs', element: <PipelineRunDetailsLogsTab /> },
      { path: 'security', element: <PipelineRunSecurityTab /> },
    ],
  },
];
export default pipelineRoutes;
