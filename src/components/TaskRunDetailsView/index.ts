import { TaskRunModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { QueryTaskRun } from '../../utils/pipelinerun-utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../Workspace/utils';

export const taskRunDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return QueryTaskRun(ns, params[RouterParams.taskRunName]);
  },
  { model: TaskRunModel, verb: 'list' },
);

export { default as TaskRunDetailsViewLayout } from './TaskRunDetailsView';
export { default as TaskRunDetailsTab } from './tabs/TaskRunDetailsTab';
export { default as TaskRunLogsTab } from './tabs/TaskRunLogsTab';
export { TaskrunSecurityEnterpriseContractTab } from './tabs/TaskRunSecurityEnterpriseContractTab';
