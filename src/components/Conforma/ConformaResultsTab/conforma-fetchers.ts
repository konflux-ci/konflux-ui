import { extractConformaResultsFromTaskRunLogs } from '~/components/Conforma/utils';
import { commonFetchJSON, commonFetchText, getK8sResourceURL } from '~/k8s';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { PodModel } from '~/models/pod';
import type { TaskRunKind } from '~/types';
import {
  type ComponentConformaResult,
  CONFORMA_RESULT_STATUS,
  type ConformaResult,
  type ConformaRule,
  type UIConformaData,
} from '~/types/conforma';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { getTaskRunLog } from '~/utils/tekton-results';

const mapToUIConformaData = (
  v: ConformaRule,
  compResult: ComponentConformaResult,
  status: CONFORMA_RESULT_STATUS,
): UIConformaData => ({
  title: v.metadata?.title,
  description: v.metadata?.description,
  status,
  timestamp: v.metadata?.effective_on,
  component: compResult.name,
  msg: v.msg,
  collection: v.metadata?.collections,
  solution: v.metadata?.solution,
  image: compResult.containerImage,
  code: v.metadata?.code,
});

export const mapConformaResultData = (
  conformaResult: ComponentConformaResult[],
): UIConformaData[] => {
  return conformaResult.reduce((acc, compResult) => {
    compResult?.violations?.forEach((v) => {
      acc.push(mapToUIConformaData(v, compResult, CONFORMA_RESULT_STATUS.violations));
    });
    compResult?.warnings?.forEach((v) => {
      acc.push(mapToUIConformaData(v, compResult, CONFORMA_RESULT_STATUS.warnings));
    });
    compResult?.successes?.forEach((v) => {
      acc.push(mapToUIConformaData(v, compResult, CONFORMA_RESULT_STATUS.successes));
    });
    return acc;
  }, [] as UIConformaData[]);
};

export type ConformaFetchResult = {
  result: ConformaResult | undefined;
  source: 'kubearchive' | 'tekton-results';
  kubearchiveFailed?: boolean;
};

export async function fetchConformaLogFromKubearchive(
  namespace: string,
  taskRun: TaskRunKind,
): Promise<ConformaResult> {
  const podName = taskRun.status?.podName;
  if (!podName) {
    throw new Error('TaskRun has no podName — cannot construct kubearchive log URL');
  }

  const podLogOpts = {
    ns: namespace,
    name: podName,
    path: 'log',
    queryParams: { container: 'step-report-json', follow: 'true' },
  };

  const url = getK8sResourceURL(PodModel, undefined, podLogOpts);
  const fetchOpts = { pathPrefix: KUBEARCHIVE_PATH_PREFIX };

  try {
    return await commonFetchJSON<ConformaResult>(url, fetchOpts);
  } catch {
    // KubeArchive pod log endpoint may return text/plain — attempt manual parse
    const rawText = await commonFetchText(url, fetchOpts);
    try {
      return JSON.parse(rawText.trim()) as ConformaResult;
    } catch {
      // Last resort: the response might use the Tekton Results bundled-log format
      return extractConformaResultsFromTaskRunLogs(rawText);
    }
  }
}

export async function fetchConformaLogFromTektonResults(
  _namespace: string,
  taskRun: TaskRunKind,
): Promise<ConformaResult> {
  const taskRunUid = taskRun.metadata?.uid;
  const taskRunNs = taskRun.metadata?.namespace;
  const pipelineRunUid = getPipelineRunFromTaskRunOwnerRef(taskRun)?.uid;

  if (!taskRunUid || !taskRunNs || !pipelineRunUid) {
    throw new Error('TaskRun missing uid/namespace or PipelineRun ownerRef');
  }

  const logs = await getTaskRunLog(taskRunNs, taskRunUid, pipelineRunUid);
  return extractConformaResultsFromTaskRunLogs(logs);
}

export async function resolveConformaResultFromTaskRun(
  namespace: string,
  taskRun: TaskRunKind,
  isKubearchiveLogsEnabled: boolean,
): Promise<ConformaFetchResult> {
  const hasPodName = !!taskRun.status?.podName;

  if (isKubearchiveLogsEnabled && hasPodName) {
    try {
      const result = await fetchConformaLogFromKubearchive(namespace, taskRun);
      return { result, source: 'kubearchive' };
    } catch {
      // KubeArchive fetch failed — fall back to Tekton Results but surface the failure
      const result = await fetchConformaLogFromTektonResults(namespace, taskRun);
      return { result, source: 'tekton-results', kubearchiveFailed: true };
    }
  }

  if (isKubearchiveLogsEnabled && !hasPodName) {
    // Archived TaskRun lacks podName — must use Tekton Results, flag it so the UI can warn
    const result = await fetchConformaLogFromTektonResults(namespace, taskRun);
    return { result, source: 'tekton-results', kubearchiveFailed: true };
  }

  const result = await fetchConformaLogFromTektonResults(namespace, taskRun);
  return { result, source: 'tekton-results' };
}

/**
 * Filters individual 404-artifact violations from each component rather than
 * dropping the entire component. This prevents a single 404 row from hiding
 * all other valid violations for that component.
 */
export const filterInvalidImageConformaRows = (
  components: ComponentConformaResult[],
): ComponentConformaResult[] =>
  components.map((comp) => ({
    ...comp,
    violations: comp.violations?.filter((v) => !(v.msg?.includes('404 Not Found') && !v.metadata)),
  }));
