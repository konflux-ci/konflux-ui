import { commonFetchJSON } from '~/k8s';
import { KUEUE_VISIBILITY_API_PATH } from './const';
import { KueuePendingWorkloadsSummary } from './types';

/**
 * Fetches the pending (not-yet-admitted) workloads for a single Kueue LocalQueue.
 *
 * Called once per unique LocalQueue name, not once per PipelineRun. Multiple
 * row-level hooks sharing the same `(namespace, queueName)` pair will share a
 * single request via React Query dedup.
 *
 * `GET /apis/visibility.kueue.x-k8s.io/v1beta2/namespaces/{ns}/localqueues/{queueName}/pendingworkloads`
 *
 * @see https://kueue.sigs.k8s.io/docs/tasks/manage/monitor_pending_workloads/pending_workloads_on_demand/
 */
export const fetchKueuePendingWorkloads = (
  namespace: string,
  queueName: string,
): Promise<KueuePendingWorkloadsSummary> =>
  commonFetchJSON<KueuePendingWorkloadsSummary>(
    `${KUEUE_VISIBILITY_API_PATH}/namespaces/${namespace}/localqueues/${encodeURIComponent(queueName)}/pendingworkloads`,
  );
