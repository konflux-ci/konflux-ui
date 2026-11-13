import { KueueLocalQueueModel } from '~/models/kueue';

/** Base path of the Kueue visibility API, proxied through the k8s API server. */
export const KUEUE_VISIBILITY_API_PATH = `/apis/${KueueLocalQueueModel.apiGroup}/${KueueLocalQueueModel.apiVersion}`;

export const KUEUE_PENDING_WORKLOADS_PATH_SUFFIX = 'pendingworkloads';

/**
 * Label set by the tekton-kueue admission webhook on every PipelineRun it admits,
 * naming the Kueue LocalQueue the PipelineRun was submitted to. A namespace may
 * have more than one LocalQueue, so this label is the only reliable way to know
 * which one a given PipelineRun belongs to.
 * @see https://github.com/konflux-ci/tekton-kueue/blob/main/pkg/common/constants.go
 */
export const KUEUE_QUEUE_NAME_LABEL = 'kueue.x-k8s.io/queue-name';

/**
 * Label naming the Kueue WorkloadPriorityClass a PipelineRun was admitted with
 * (e.g. `konflux-pre-merge-test`). Used to show the class name next to the
 * numeric priority from the visibility API.
 */
export const KUEUE_PRIORITY_CLASS_LABEL = 'kueue.x-k8s.io/priority-class';

/**
 * Default polling interval (ms) for the Kueue visibility API. The API does not
 * support watch, so the UI must poll for updated queue positions. 60s balances
 * freshness against load on the API server.
 */
export const DEFAULT_KUEUE_POLLING_INTERVAL_MS = 60_000;

/**
 * How long (ms) to cache the `isKueueAvailable` condition result before
 * re-running the API discovery check. A finite TTL ensures that a transient
 * network failure doesn't permanently disable Kueue features.
 */
export const KUEUE_CONDITION_TTL_MS = 30_000;
