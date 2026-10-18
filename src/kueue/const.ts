export const KUEUE_VISIBILITY_API_GROUP = 'visibility.kueue.x-k8s.io';
export const KUEUE_VISIBILITY_API_VERSION = 'v1beta2';

/** Base path of the Kueue visibility API, proxied through the k8s API server. */
export const KUEUE_VISIBILITY_API_PATH = `/apis/${KUEUE_VISIBILITY_API_GROUP}/${KUEUE_VISIBILITY_API_VERSION}`;

/**
 * Label set by the tekton-kueue admission webhook on every PipelineRun it admits,
 * naming the Kueue LocalQueue the PipelineRun was submitted to. A namespace may
 * have more than one LocalQueue, so this label is the only reliable way to know
 * which one a given PipelineRun belongs to.
 * @see https://github.com/konflux-ci/tekton-kueue/blob/main/pkg/common/constants.go
 */
export const KUEUE_QUEUE_NAME_LABEL = 'kueue.x-k8s.io/queue-name';

/**
 * Default polling interval (ms) for the Kueue visibility API. The API does not
 * support watch, so the UI must poll for updated queue positions. 30s balances
 * freshness against load on the API server, per the feature's design doc.
 */
export const DEFAULT_KUEUE_POLLING_INTERVAL_MS = 30_000;
