import { STALE_ARCHIVE_SUCCEEDED_REASONS } from '../consts/pipelinerun';
import { PipelineRunModel, ReleaseModel } from '../models';
import {
  Condition,
  PipelineRunKind,
  PipelineRunKindV1Beta1,
  ReleaseCondition,
  ReleaseKind,
} from '../types';
import { K8sModelCommon, K8sResourceCommon } from '../types/k8s';

type PipelineRunResource = PipelineRunKindV1Beta1 | PipelineRunKind;

export const filterDeletedResources = <R extends K8sResourceCommon[]>(resources: R) => {
  return resources.filter((res) => !res.metadata.deletionTimestamp);
};

function isStaleRunningPipelineRunCondition(c: Condition): boolean {
  return (
    c.status === 'Unknown' &&
    c.type === 'Succeeded' &&
    STALE_ARCHIVE_SUCCEEDED_REASONS.has(c.reason ?? '')
  );
}

function isStaleDeletedIncompletePipelineRun(pipelinerun: PipelineRunResource): boolean {
  return (
    !!pipelinerun.metadata?.deletionTimestamp &&
    !pipelinerun.status?.completionTime &&
    (pipelinerun.status?.conditions?.some(isStaleRunningPipelineRunCondition) ?? false)
  );
}

function isStaleRunningReleaseCondition(c: Condition): boolean {
  return c.status === 'False' && c.type === ReleaseCondition.Released && c.reason === 'Progressing';
}

function isStaleDeletedIncompleteRelease(release: ReleaseKind): boolean {
  return (
    !!release.metadata?.deletionTimestamp &&
    (release.status?.conditions?.some(isStaleRunningReleaseCondition) ?? false)
  );
}

/*
  When pipelineruns are running, etcd keeps their live record; archive/Tekton Results may retain
  copies with Succeeded conditions stuck at status Unknown and reasons such as Running,
  ResolvingTaskRef, ResolvingPipelineRef, or PipelineRunPending. After live delete, those archive
  rows are never finalized and would show as perpetual Running in the UI.

  KubeArchive list queries filter via isStaleDeletedIncompletePipelineRun (requires deletionTimestamp
  and no completionTime). Tekton Results uses filterOutStaleRunningPipelineRunsFromArchive, which
  applies the same reason set without a deletionTimestamp gate because Results records lack that
  metadata once the apiserver object is gone.
  */
export const filterOutStaleRunningPipelineRunsFromArchive = (
  pipelineRuns: PipelineRunResource[] | undefined,
): PipelineRunResource[] | undefined =>
  pipelineRuns?.filter(
    (pipelinerun) =>
      pipelinerun?.status?.conditions?.every((c) => !isStaleRunningPipelineRunCondition(c)) ??
      true,
  );

export const filterOutDeletedAndStaleRunningResources = <T extends K8sResourceCommon>(
  resources: T[],
  model: K8sModelCommon,
): T[] => {
  if (model === PipelineRunModel) {
    return (resources as unknown as PipelineRunResource[]).filter(
      (pipelinerun) => !isStaleDeletedIncompletePipelineRun(pipelinerun),
    ) as unknown as T[];
  }

  if (model === ReleaseModel) {
    return (resources as unknown as ReleaseKind[]).filter(
      (release) => !isStaleDeletedIncompleteRelease(release),
    ) as unknown as T[];
  }

  return filterDeletedResources(resources) as unknown as T[];
};
