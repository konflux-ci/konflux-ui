import { K8sQueryCreateResource, K8sQueryPatchResource } from '../k8s';
import { PipelineRunModel } from '../models';
import { PipelineRunKind } from '../types/pipeline-run';
import { getPipelineRunData } from './pipeline-utils';

export const pipelineRunRerun = (pipelineRun: PipelineRunKind) => {
  const pipelineRunData = getPipelineRunData(pipelineRun, { generateName: true });

  return K8sQueryCreateResource({
    model: PipelineRunModel,
    queryOptions: {
      name: pipelineRunData.metadata.name,
      ns: pipelineRun.metadata.namespace,
    },
    resource: pipelineRunData,
  });
};

export const pipelineRunStop = (pipelineRun: PipelineRunKind) => {
  return K8sQueryPatchResource({
    model: PipelineRunModel,
    queryOptions: {
      name: pipelineRun.metadata.name,
      ns: pipelineRun.metadata.namespace,
    },
    patches: [
      {
        op: 'replace',
        path: `/spec/status`,
        value: 'StoppedRunFinally',
      },
    ],
  });
};

export const pipelineRunCancel = (pipelineRun: PipelineRunKind) => {
  return K8sQueryPatchResource({
    model: PipelineRunModel,
    queryOptions: {
      name: pipelineRun.metadata.name,
      ns: pipelineRun.metadata.namespace,
    },
    patches: [
      {
        op: 'replace',
        path: `/spec/status`,
        value: 'CancelledRunFinally',
      },
    ],
  });
};
