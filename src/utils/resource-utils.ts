import { PipelineRunKind, PipelineRunKindV1Beta1 } from '../types';
import { K8sResourceCommon } from '../types/k8s';

export const filterDeletedResources = <R extends K8sResourceCommon[]>(resources: R) => {
  return resources.filter((res) => !res.metadata.deletionTimestamp);
};

/*
  When pipelineruns are running, the etcd would keep their results.
  While the tekton record would keep the conditions as:
  "conditions": [
    {
      "type": "Succeeded",
      "reason": "Running",
      "status": "Unknown",
    ...
  Deleting pipelines from etcd makes the tekton record would be never updated as others.
  So for those tekton results, it is useless to users and we need to filter them out.
  Otherwise, these jobs would be always shown as 'Running' and bring unexpected troubles.
  */
export const filterOutStaleRunningPipelineRunsFromArchive = (
  pipelineRuns: (PipelineRunKindV1Beta1 | PipelineRunKind)[] | undefined,
): (PipelineRunKindV1Beta1 | PipelineRunKind)[] | undefined => {
  return pipelineRuns?.filter((pipelinerun) => {
    return (
      pipelinerun?.status?.conditions?.every(
        (c) => !(c.status === 'Unknown' && c.type === 'Succeeded' && c.reason === 'Running'),
      ) ?? true
    );
  });
};
