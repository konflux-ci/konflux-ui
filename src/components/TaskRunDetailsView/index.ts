import { isFeatureFlagOn } from '../../feature-flags/utils';
import { TaskRunModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { QueryTaskRun, QueryTaskRunWithKubearchive } from '../../utils/pipelinerun-utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const taskRunDetailsViewLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    const taskRunName = params[RouterParams.taskRunName];

    if (isFeatureFlagOn('taskruns-kubearchive')) {
      return QueryTaskRunWithKubearchive(ns, taskRunName);
    }

    return QueryTaskRun(ns, taskRunName);
  },
  { model: TaskRunModel, verb: 'list' },
);

export { default as TaskRunDetailsViewLayout } from './TaskRunDetailsView';
export { default as TaskRunDetailsTab } from './tabs/TaskRunDetailsTab';
export { default as TaskRunLogsTab } from './tabs/TaskRunLogsTab';
export { TaskRunSecurityTab } from './tabs/TaskRunSecurityTab';
