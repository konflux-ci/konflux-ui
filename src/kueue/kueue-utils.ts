import { PipelineRunKind } from '~/types';
import { KUEUE_QUEUE_NAME_LABEL } from './const';
import { KueuePendingWorkload, KueueQueuePosition, KueueQueuePositionsByPipelineRun } from './types';

/**
 * Collects the unique set of Kueue LocalQueue names referenced by a list of
 * PipelineRuns, via the `kueue.x-k8s.io/queue-name` label set by the tekton-kueue
 * admission webhook. A namespace may have more than one LocalQueue.
 *
 * Used so callers can fetch pending workloads once per LocalQueue instead of
 * once per PipelineRun.
 */
export const getKueueQueueNames = (pipelineRuns: PipelineRunKind[]): string[] => {
  const queueNames = new Set<string>();
  pipelineRuns.forEach((plr) => {
    const queueName = plr.metadata?.labels?.[KUEUE_QUEUE_NAME_LABEL];
    if (queueName) {
      queueNames.add(queueName);
    }
  });
  return Array.from(queueNames);
};

/** Finds the PipelineRun name a pending workload belongs to via its `ownerReferences`. */
const getPipelineRunNameFromOwnerReferences = (
  workload: KueuePendingWorkload,
): string | undefined =>
  workload.metadata?.ownerReferences?.find((ref) => ref.kind === 'PipelineRun')?.name;

/**
 * Flattens pending-workload lists from one or more LocalQueues into a single
 * lookup map keyed by PipelineRun name, matching each workload back to its
 * owning PipelineRun via `metadata.ownerReferences`. Workloads with no
 * resolvable PipelineRun owner reference are skipped.
 */
export const buildQueuePositionsByPipelineRun = (
  workloadsByQueue: KueuePendingWorkload[][],
): KueueQueuePositionsByPipelineRun =>
  workloadsByQueue.flat().reduce<KueueQueuePositionsByPipelineRun>((acc, workload) => {
    const pipelineRunName = getPipelineRunNameFromOwnerReferences(workload);
    if (!pipelineRunName) {
      return acc;
    }
    const position: KueueQueuePosition = {
      positionInClusterQueue: workload.positionInClusterQueue,
      positionInLocalQueue: workload.positionInLocalQueue,
      priority: workload.priority,
      creationTimestamp: workload.metadata?.creationTimestamp,
    };
    acc[pipelineRunName] = position;
    return acc;
  }, {});
