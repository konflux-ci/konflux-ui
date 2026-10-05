import NamespacePipelineRunDetailsTab from '~/components/PipelineRun/NamespacePipelineRunDetails/NamespacePipelineRunDetailsTab';
import NamespacePipelineRunDetailsView from '~/components/PipelineRun/NamespacePipelineRunDetails/NamespacePipelineRunDetailsView';
import NamespacePipelineRunTaskRunsTab from '~/components/PipelineRun/NamespacePipelineRunDetails/NamespacePipelineRunTaskRunsTab';
import {
  PipelineRunDetailsLayout,
  PipelineRunDetailsLogsTab,
  PipelineRunDetailsTab,
  pipelineRunDetailsViewLoader,
  PipelineRunSecurityTab,
  PipelineRunTaskRunsTab,
  PipelineRunVulnerabilitiesTab,
} from '../../components/PipelineRun/PipelineRunDetailsView';
import { PIPELINE_RUNS_DETAILS_PATH, NAMESPACE_PIPELINE_RUN_DETAILS_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const pipelineRoutes = [
  {
    path: NAMESPACE_PIPELINE_RUN_DETAILS_PATH.path,
    errorElement: <RouteErrorBoundry />,
    loader: pipelineRunDetailsViewLoader,
    element: <NamespacePipelineRunDetailsView />,
    children: [
      { index: true, element: <NamespacePipelineRunDetailsTab /> },
      { path: 'taskruns', element: <NamespacePipelineRunTaskRunsTab /> },
      { path: 'logs', element: <PipelineRunDetailsLogsTab /> },
    ],
  },
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
      { path: 'vulnerabilities', element: <PipelineRunVulnerabilitiesTab /> },
      { path: 'security', element: <PipelineRunSecurityTab /> },
    ],
  },
];
export default pipelineRoutes;
