import { runStatus } from '~/consts/pipelinerun';
import { PipelineRunModel } from '~/models/pipelineruns';
import type { PipelineRunKind } from '~/types';
import type { KueuePendingWorkloadKind, KueueQueuePosition } from '~/types/kueue';
import { PLRStatus } from '~/utils/plr-status-config';
import { KUEUE_QUEUE_NAME_LABEL } from './const';

/**
 * Finds the PipelineRun owner reference for a pending workload, matching by
 * both `kind` and `uid` so that a recreated PipelineRun with the same name
 * cannot match a stale workload.
 */
const findPipelineRunOwnerReference = (
  workload: KueuePendingWorkloadKind,
  pipelineRunUid: string,
) =>
  workload.metadata?.ownerReferences?.find(
    (ref) => ref.kind === PipelineRunModel.kind && ref.uid === pipelineRunUid,
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
  items: KueuePendingWorkloadKind[],
  pipelineRunUid: string,
): KueueQueuePosition | undefined => {
  const workload = items.find((w) => findPipelineRunOwnerReference(w, pipelineRunUid));
  if (!workload) {
    return undefined;
  }
  return {
    positionInClusterQueue: workload.positionInClusterQueue,
    positionInLocalQueue: workload.positionInLocalQueue,
    localQueueName: workload.localQueueName,
    priority: workload.priority,
  };
};

/**
 * Whether the Kueue queue wait info (position, priority, time waiting) should be shown for
 * a PipelineRun. Requires the flag, the Kueue queue-name label, and a derived `Queued`
 * status; the label check excludes PAC-only queued runs.
 */
export const isKueueQueueWaitVisible = (pipelineRun: PipelineRunKind, isFlagOn: boolean): boolean =>
  isFlagOn &&
  pipelineRun.metadata?.labels?.[KUEUE_QUEUE_NAME_LABEL] !== undefined &&
  PLRStatus.registry.deriveStatus(pipelineRun) === runStatus.Queued;
