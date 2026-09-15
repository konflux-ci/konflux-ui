import { commonFetchText, getK8sResourceURL } from '~/k8s';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { PodModel } from '~/models/pod';
import { logger } from '~/monitoring/logger';
import type { TaskRunKind } from '~/types';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { getTaskRunLog } from '~/utils/tekton-results';
import {
  extractCveReportFromRawLog,
  extractCveReportFromTaskRunLogs,
  extractImagePlatformsFromLogs,
} from './roxctl-utils';
import type { RoxctlCveReportResolution } from './types';

const ROX_IMAGE_SCAN_CONTAINER = 'step-rox-image-scan';
// Upstream step name is misspelled "proccess"; container is `step-proccess-output`.
const ROX_PROCESS_OUTPUT_CONTAINER = 'step-proccess-output';

const fetchPodContainerLog = async (
  namespace: string,
  podName: string,
  container: string,
  pathPrefix?: string,
): Promise<string> => {
  const podLogOpts = {
    ns: namespace,
    name: podName,
    path: 'log',
    queryParams: { container },
  };

  return commonFetchText(getK8sResourceURL(PodModel, undefined, podLogOpts), {
    pathPrefix,
  });
};

/**
 * Fetches the roxctl CVE report from KubeArchive by reading the
 * `step-proccess-output` container log directly.
 *
 * KubeArchive returns the raw container log (the step's stdout was the
 * CVE-oriented JSON), so we parse the text ourselves to handle both the
 * flat-array and nested-object formats. Image platform labels are read from
 * the `step-rox-image-scan` container log when available.
 */
export async function fetchCveReportFromKubearchive(
  namespace: string,
  taskRun: TaskRunKind,
): Promise<RoxctlCveReportResolution> {
  const podName = taskRun.status?.podName;
  if (!podName) {
    throw new Error('TaskRun has no podName — cannot construct kubearchive log URL');
  }

  const rawLog = await fetchPodContainerLog(
    namespace,
    podName,
    ROX_PROCESS_OUTPUT_CONTAINER,
    KUBEARCHIVE_PATH_PREFIX,
  );

  let imagePlatforms: string[] = [];
  try {
    const scanLog = await fetchPodContainerLog(
      namespace,
      podName,
      ROX_IMAGE_SCAN_CONTAINER,
      KUBEARCHIVE_PATH_PREFIX,
    );
    imagePlatforms = extractImagePlatformsFromLogs(scanLog);
  } catch (err) {
    logger.warn(
      'Failed to fetch rox-image-scan log for image platform extraction; imagePlatforms will be empty',
      { error: err instanceof Error ? err.message : String(err) },
    );
  }

  return {
    reports: extractCveReportFromRawLog(rawLog),
    imagePlatforms,
  };
}

/**
 * Fetches the roxctl CVE report from Tekton Results by downloading the full
 * TaskRun log and extracting the CVE JSON with a regex.
 *
 * Follows the same pattern as the Conforma fetcher in
 * `conforma-fetchers.ts:fetchConformaLogFromTektonResults`.
 */
export async function fetchCveReportFromTektonResults(
  _namespace: string,
  taskRun: TaskRunKind,
): Promise<RoxctlCveReportResolution> {
  const taskRunUid = taskRun.metadata?.uid;
  const taskRunNs = taskRun.metadata?.namespace;
  const pipelineRunUid = getPipelineRunFromTaskRunOwnerRef(taskRun)?.uid;

  if (!taskRunUid || !taskRunNs || !pipelineRunUid) {
    throw new Error('TaskRun missing uid/namespace or PipelineRun ownerRef');
  }

  const logs = await getTaskRunLog(taskRunNs, taskRunUid, pipelineRunUid);

  return {
    reports: extractCveReportFromTaskRunLogs(logs),
    imagePlatforms: extractImagePlatformsFromLogs(logs),
  };
}

/**
 * Unified resolver that picks the appropriate fetcher based on the
 * KubeArchive logs feature flag.
 *
 * When `isKubearchiveLogsEnabled` is true, fetches from KubeArchive (direct
 * container log). Otherwise falls back to Tekton Results (full log + regex).
 */
export async function resolveRoxctlCveReport(
  namespace: string,
  taskRun: TaskRunKind,
  isKubearchiveLogsEnabled: boolean,
): Promise<RoxctlCveReportResolution> {
  if (isKubearchiveLogsEnabled) {
    return fetchCveReportFromKubearchive(namespace, taskRun);
  }
  return fetchCveReportFromTektonResults(namespace, taskRun);
}
