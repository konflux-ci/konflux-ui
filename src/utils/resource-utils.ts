import { PipelineRunModel, ReleaseModel } from '../models';
import {
  Condition,
  PipelineRunKind,
  PipelineRunKindV1Beta1,
  ReleaseCondition,
  ReleaseKind,
} from '../types';
import { K8sModelCommon, K8sResourceCommon } from '../types/k8s';

export const filterDeletedResources = <R extends K8sResourceCommon[]>(resources: R) => {
  return resources.filter((res) => !res.metadata.deletionTimestamp);
};

const isStaleRunningPipelineRunCondition = (c: Condition): boolean =>
  c.status === 'Unknown' && c.type === 'Succeeded' && c.reason === 'Running';

const isStaleRunningReleaseCondition = (c: Condition): boolean =>
  c.status === 'False' && c.type === ReleaseCondition.Released && c.reason === 'Progressing';

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
      pipelinerun?.status?.conditions?.every((c) => !isStaleRunningPipelineRunCondition(c)) ?? true
    );
  });
};

export const filterOutDeletedAndStaleRunningResources = <T extends K8sResourceCommon>(
  resources: T[],
  model: K8sModelCommon,
): T[] => {
  if (model === PipelineRunModel) {
    return (resources as unknown as (PipelineRunKindV1Beta1 | PipelineRunKind)[])?.filter(
      (pipelinerun) => {
        return (
          (pipelinerun?.status?.conditions?.every((c) => !isStaleRunningPipelineRunCondition(c)) ??
            true) ||
          !pipelinerun.metadata?.deletionTimestamp
        );
      },
    ) as unknown as T[];
  }

  if (model === ReleaseModel) {
    return (resources as unknown as ReleaseKind[])?.filter((release) => {
      return (
        (release?.status?.conditions?.every((c) => !isStaleRunningReleaseCondition(c)) ?? true) ||
        !release.metadata?.deletionTimestamp
      );
    }) as unknown as T[];
  }

  return filterDeletedResources(resources) as unknown as T[];
};
