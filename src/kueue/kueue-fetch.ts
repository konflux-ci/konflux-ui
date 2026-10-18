import { commonFetchJSON } from '~/k8s';
import { KUEUE_VISIBILITY_API_PATH } from './const';
import { KueuePendingWorkloadsSummary } from './types';

/**
 * Fetches the pending (not-yet-admitted) workloads for a single Kueue LocalQueue.
 *
 * Called once per unique LocalQueue name, not once per PipelineRun -- see
 * `getKueueQueueNames` in `./kueue-utils`.
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
