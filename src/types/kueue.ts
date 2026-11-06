/* v8 ignore start -- pure TypeScript interfaces; no runtime code to cover */
import type { K8sResourceCommon } from '~/types/k8s';

/**
 * A single pending (not-yet-admitted) workload entry as returned by the Kueue
 * visibility API. Mirrors `PendingWorkload` from the upstream Kueue API:
 * @see https://github.com/kubernetes-sigs/kueue/blob/main/apis/visibility/v1beta2/types.go
 *
 * Uses `Partial<K8sResourceCommon>` because workload items are embedded in a
 * list response and do not carry their own `apiVersion`/`kind`.
 */
export type KueuePendingWorkloadKind = Partial<K8sResourceCommon> & {
  /** Numeric priority of the workload (e.g. 1000 for konflux-release, 300 for konflux-dependency-update). */
  priority: number;
  /** Name of the LocalQueue the workload was submitted to. */
  localQueueName: string;
  /** 0-based position in the cluster-wide ClusterQueue. The globally meaningful number, since the 200-slot quota is cluster-wide. */
  positionInClusterQueue: number;
  /** 0-based position within the namespace's LocalQueue. */
  positionInLocalQueue: number;
};

/** Response shape of `GET .../localqueues/{name}/pendingworkloads`. */
export interface KueuePendingWorkloadsSummary extends K8sResourceCommon {
  items: KueuePendingWorkloadKind[];
}

/** Per-PipelineRun queue info resolved by `useKueueQueuePositionForPipelineRun`. */
export type KueueQueuePosition = Pick<
  KueuePendingWorkloadKind,
  'priority' | 'localQueueName' | 'positionInClusterQueue' | 'positionInLocalQueue'
>;
