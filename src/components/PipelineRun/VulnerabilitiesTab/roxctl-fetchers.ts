import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { logger } from '~/monitoring/logger';
import type { TaskRunKind } from '~/types';
import { getPipelineRunFromTaskRunOwnerRef, has404Error } from '~/utils/common-utils';
import { fetchPodContainerLog } from '~/utils/pod-logs';
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

type RoxctlPodLogs = {
  reportLog: string;
  scanLog?: string;
};

const fetchRoxctlLogsFromPod = async (
  namespace: string,
  taskRun: TaskRunKind,
  pathPrefix?: string,
): Promise<RoxctlPodLogs> => {
  const podName = taskRun.status?.podName;
  if (!podName) {
    throw new Error('TaskRun has no podName — cannot construct Pod log URL');
  }

  const reportLogPromise = fetchPodContainerLog(
    namespace,
    podName,
    ROX_PROCESS_OUTPUT_CONTAINER,
    pathPrefix,
  );
  const scanLogPromise = fetchPodContainerLog(
    namespace,
    podName,
    ROX_IMAGE_SCAN_CONTAINER,
    pathPrefix,
  ).catch((err) => {
    logger.warn(
      'Failed to fetch rox-image-scan log for image platform extraction; imagePlatforms will be empty',
      { error: err instanceof Error ? err.message : String(err) },
    );
    return undefined;
  });

  const [reportLog, scanLog] = await Promise.all([reportLogPromise, scanLogPromise]);

  return { reportLog, scanLog };
};

const toCveReportResolution = ({
  reportLog,
  scanLog,
}: RoxctlPodLogs): RoxctlCveReportResolution => ({
  reports: extractCveReportFromRawLog(reportLog),
  imagePlatforms: scanLog ? extractImagePlatformsFromLogs(scanLog) : [],
});

const fetchCveReportFromPod = async (
  namespace: string,
  taskRun: TaskRunKind,
  pathPrefix?: string,
): Promise<RoxctlCveReportResolution> =>
  toCveReportResolution(await fetchRoxctlLogsFromPod(namespace, taskRun, pathPrefix));

/**
 * Fetches the roxctl CVE report from KubeArchive by reading the
 * `step-proccess-output` container log directly.
 *
 * KubeArchive returns the raw container log (the step's stdout was the
 * CVE-oriented JSON), so we parse the text ourselves to handle both the
 * flat-array and nested-object formats. Image platform labels are read from
 * the `step-rox-image-scan` container log when available.
 */
export function fetchCveReportFromKubearchive(
  namespace: string,
  taskRun: TaskRunKind,
): Promise<RoxctlCveReportResolution> {
  return fetchCveReportFromPod(namespace, taskRun, KUBEARCHIVE_PATH_PREFIX);
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
 * Unified resolver that prefers live cluster logs and falls back to the
 * configured historical log source when the Pod is no longer in the cluster.
 *
 * When `isKubearchiveLogsEnabled` is true, KubeArchive is used after a live
 * cluster 404. Otherwise, Tekton Results is used after a live cluster 404.
 */
export async function resolveRoxctlCveReport(
  namespace: string,
  taskRun: TaskRunKind,
  isKubearchiveLogsEnabled: boolean,
): Promise<RoxctlCveReportResolution> {
  try {
    return await fetchCveReportFromPod(namespace, taskRun);
  } catch (clusterError) {
    if (!has404Error(clusterError)) {
      throw clusterError;
    }

    if (isKubearchiveLogsEnabled) {
      return fetchCveReportFromKubearchive(namespace, taskRun);
    }

    return fetchCveReportFromTektonResults(namespace, taskRun);
  }
}
