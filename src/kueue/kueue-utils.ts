import { KueuePendingWorkload, KueueQueuePosition } from './types';

/** Finds the PipelineRun name a pending workload belongs to via its `ownerReferences`. */
const getPipelineRunNameFromOwnerReferences = (
  workload: KueuePendingWorkload,
): string | undefined =>
  workload.metadata?.ownerReferences?.find((ref) => ref.kind === 'PipelineRun')?.name;

/**
 * Finds the queue position for a single PipelineRun within a flat list of
 * pending workloads (from one LocalQueue). Matches via `metadata.ownerReferences`.
 *
 * Returns `undefined` when the PipelineRun is not found among the pending workloads
 * (e.g. it has already been admitted or belongs to a different queue).
 */
export const getKueueQueuePositionForPipelineRun = (
  items: KueuePendingWorkload[],
  pipelineRunName: string,
): KueueQueuePosition | undefined => {
  const workload = items.find(
    (w) => getPipelineRunNameFromOwnerReferences(w) === pipelineRunName,
  );
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
