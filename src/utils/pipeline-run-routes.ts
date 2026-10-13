import { PipelineRunLabel } from '~/consts/pipelinerun';
import {
  COMPONENT_ACTIVITY_V2_PATH,
  COMPONENT_DETAILS_V2_PATH,
  COMPONENTS_PATH,
  GROUP_DETAILS_PATH,
  GROUP_PIPELINE_RUNS_PATH,
  GROUPS_PATH,
  NAMESPACE_PIPELINE_RUN_DETAILS_PATH,
  NAMESPACE_TASK_RUN_DETAILS_PATH,
  PIPELINE_RUNS_DETAILS_PATH,
  TASKRUN_DETAILS_PATH,
} from '~/routes/paths';
import { PipelineRunKind, TaskRunKind, TektonResourceLabel } from '~/types';

export const getPipelineRunDetailsPath = (run: PipelineRunKind): string => {
  const applicationName = run.metadata.labels?.[PipelineRunLabel.APPLICATION];
  const params = {
    workspaceName: run.metadata.namespace,
    pipelineRunName: run.metadata.name,
  };
  return applicationName
    ? PIPELINE_RUNS_DETAILS_PATH.createPath({ ...params, applicationName })
    : NAMESPACE_PIPELINE_RUN_DETAILS_PATH.createPath(params);
};

export const getTaskRunDetailsPath = (
  task: TaskRunKind,
  namespace: string,
  parent?: PipelineRunKind,
): string | undefined => {
  const applicationName = (parent ?? task).metadata.labels?.[PipelineRunLabel.APPLICATION];
  const params = { workspaceName: namespace, taskRunName: task.metadata.name };
  if (applicationName) return TASKRUN_DETAILS_PATH.createPath({ ...params, applicationName });
  const pipelineRunName =
    parent?.metadata.name ||
    task.metadata.labels?.[TektonResourceLabel.pipelinerun] ||
    task.metadata.ownerReferences?.find((owner) => owner.kind === 'PipelineRun')?.name;
  return pipelineRunName
    ? NAMESPACE_TASK_RUN_DETAILS_PATH.createPath({ ...params, pipelineRunName })
    : undefined;
};

export const getPipelineRunBreadcrumbs = (run: PipelineRunKind) => {
  const workspaceName = run.metadata.namespace;
  const groupName = run.metadata.labels?.[PipelineRunLabel.COMPONENT_GROUP];
  const componentName = run.metadata.labels?.[PipelineRunLabel.COMPONENT];
  const parents = groupName
    ? [
        { name: 'Groups', path: GROUPS_PATH.createPath({ workspaceName }) },
        { name: groupName, path: GROUP_DETAILS_PATH.createPath({ workspaceName, groupName }) },
        {
          name: 'Pipeline runs',
          path: GROUP_PIPELINE_RUNS_PATH.createPath({ workspaceName, groupName }),
        },
      ]
    : componentName
      ? [
          { name: 'Components', path: COMPONENTS_PATH.createPath({ workspaceName }) },
          {
            name: componentName,
            path: COMPONENT_DETAILS_V2_PATH.createPath({ workspaceName, componentName }),
          },
          {
            name: 'Pipeline runs',
            path: COMPONENT_ACTIVITY_V2_PATH.extend('pipelineruns').createPath({
              workspaceName,
              componentName,
            }),
          },
        ]
      : undefined;
  return parents && [...parents, { name: run.metadata.name, path: getPipelineRunDetailsPath(run) }];
};
