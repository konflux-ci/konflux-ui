import { PipelineRunModel, TaskRunModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { QueryPipelineRun } from '../../../utils/pipelinerun-utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../../Workspace/utils';

export const pipelineRunDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return QueryPipelineRun(ns, params[RouterParams.pipelineRunName]);
  },
  [
    { model: PipelineRunModel, verb: 'list' },
    { model: TaskRunModel, verb: 'list' },
  ],
);

export { default as PipelineRunDetailsLayout } from './PipelineRunDetailsView';
export { default as PipelineRunDetailsTab } from './tabs/PipelineRunDetailsTab';
export { default as PipelineRunDetailsLogsTab } from './tabs/PipelineRunLogsTab';
export { default as PipelineRunTaskRunsTab } from './tabs/PipelineRunTaskRunsTab';
export { PipelineRunSecurityEnterpriseContractTab } from './tabs/PipelineRunSecurityEnterpriseContractTab';
