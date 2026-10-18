/* v8 ignore start -- pure TypeScript interfaces; no runtime code to cover */
import { OwnerReference } from '~/types/k8s';

/**
 * A single pending (not-yet-admitted) workload entry as returned by the Kueue
 * visibility API. Mirrors `PendingWorkload` from the upstream Kueue API:
 * @see https://github.com/kubernetes-sigs/kueue/blob/main/apis/visibility/v1beta2/types.go
 */
export interface KueuePendingWorkload {
  metadata?: {
    name?: string;
    namespace?: string;
    creationTimestamp?: string;
    ownerReferences?: OwnerReference[];
    [key: string]: unknown;
  };
  /** Numeric priority of the workload (e.g. 1000 for konflux-release, 300 for konflux-dependency-update). */
  priority: number;
  /** Name of the LocalQueue the workload was submitted to. */
  localQueueName: string;
  /** 0-based position in the cluster-wide ClusterQueue. The globally meaningful number, since the 200-slot quota is cluster-wide. */
  positionInClusterQueue: number;
  /** 0-based position within the namespace's LocalQueue. */
  positionInLocalQueue: number;
}

/** Response shape of `GET .../localqueues/{name}/pendingworkloads`. */
export interface KueuePendingWorkloadsSummary {
  items: KueuePendingWorkload[];
}

/** Per-PipelineRun queue info resolved by `useKueuePendingWorkloads`. */
export interface KueueQueuePosition {
  /** 0-based position in the cluster-wide ClusterQueue (display as +1 for a 1-based position). */
  positionInClusterQueue: number;
  /** 0-based position within the namespace's LocalQueue. */
  positionInLocalQueue: number;
  priority: number;
  /** When the workload entered the queue; used to compute wait time. */
  creationTimestamp?: string;
}

/** Lookup map: PipelineRun name -> its queue position info. */
export type KueueQueuePositionsByPipelineRun = Record<string, KueueQueuePosition>;
