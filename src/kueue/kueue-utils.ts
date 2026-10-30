import type { KueuePendingWorkload, KueueQueuePosition } from '~/types/kueue';

/**
 * Finds the PipelineRun owner reference for a pending workload, matching by
 * both `kind` and `uid` so that a recreated PipelineRun with the same name
 * cannot match a stale workload.
 */
const findPipelineRunOwnerReference = (
  workload: KueuePendingWorkload,
  pipelineRunUid: string,
) =>
  workload.metadata?.ownerReferences?.find(
    (ref) => ref.kind === 'PipelineRun' && ref.uid === pipelineRunUid,
  );

/**
 * Finds the queue position for a single PipelineRun within a flat list of
 * pending workloads (from one LocalQueue). Matches via `metadata.ownerReferences`
 * using both `kind` and `uid` to avoid false matches after PipelineRun re-creation.
 *
 * Returns `undefined` when the PipelineRun is not found among the pending workloads
 * (e.g. it has already been admitted or belongs to a different queue).
 */
export const getKueueQueuePositionForPipelineRun = (
  items: KueuePendingWorkload[],
  pipelineRunUid: string,
): KueueQueuePosition | undefined => {
  const workload = items.find((w) => findPipelineRunOwnerReference(w, pipelineRunUid));
  if (!workload) {
    return undefined;
  }
  return {
    positionInClusterQueue: workload.positionInClusterQueue,
    positionInLocalQueue: workload.positionInLocalQueue,
    priority: workload.priority,
    creationTimestamp: workload.metadata?.creationTimestamp,
  };
};
