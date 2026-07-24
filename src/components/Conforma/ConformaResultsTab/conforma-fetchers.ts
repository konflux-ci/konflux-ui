import { extractConformaResultsFromTaskRunLogs } from '~/components/Conforma/utils';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { CONFORMA_TASK, EC_TASK } from '~/consts/security';
import { commonFetchJSON, getK8sResourceURL, k8sListResource, K8sResourceListOptions } from '~/k8s';
import { KUBEARCHIVE_PATH_PREFIX, KUBEARCHIVE_RESOURCE_LIMIT } from '~/kubearchive/const';
import { convertToKubearchiveQueryParams, withKubearchivePathPrefix } from '~/kubearchive/fetch-utils';
import { TaskRunGroupVersionKind, TaskRunModel } from '~/models';
import { PodModel } from '~/models/pod';
import type { TaskRunKind } from '~/types';
import {
  type ComponentConformaResult,
  CONFORMA_RESULT_STATUS,
  type ConformaResult,
  type ConformaResultRow,
  type ConformaRule,
} from '~/types/conforma';
import { TektonResourceLabel } from '~/types/coreTekton';
import type { Selector } from '~/types/k8s';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { getTaskRunLog, getTaskRuns } from '~/utils/tekton-results';

export const buildSecurityTaskRunSelector = (
  applicationName: string,
  componentName?: string,
): Selector => ({
  matchLabels: {
    [PipelineRunLabel.APPLICATION]: applicationName,
    ...(componentName ? { [PipelineRunLabel.COMPONENT]: componentName } : {}),
    [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
  },
  matchExpressions: [
    {
      key: TektonResourceLabel.pipelineTask,
      operator: 'In' as const,
      values: [EC_TASK, CONFORMA_TASK],
    },
  ],
});

/**
 * KubeArchive's list API has no server-side ordering support (unlike Tekton
 * Results, which orders by `create_time desc`), so the newest TaskRun must be
 * selected client-side from a bounded window of results.
 */
export const pickNewestTaskRun = (taskRuns: TaskRunKind[]): TaskRunKind | null => {
  if (!taskRuns.length) {
    return null;
  }
  return taskRuns.reduce((newest, current) => {
    const newestTimestamp = newest.metadata?.creationTimestamp ?? '';
    const currentTimestamp = current.metadata?.creationTimestamp ?? '';
    if (currentTimestamp === newestTimestamp) {
      return (current.metadata?.name ?? '') > (newest.metadata?.name ?? '') ? current : newest;
    }
    return currentTimestamp > newestTimestamp ? current : newest;
  });
};

export async function fetchLatestSecurityTaskRunForComponent(
  namespace: string,
  applicationName: string,
  componentName: string,
  isKubearchiveTaskRunsEnabled: boolean,
): Promise<TaskRunKind | null> {
  const selector = buildSecurityTaskRunSelector(applicationName, componentName);

  if (isKubearchiveTaskRunsEnabled) {
    const k8sQueryOptions = convertToKubearchiveQueryParams({
      groupVersionKind: TaskRunGroupVersionKind,
      namespace,
      isList: true,
      selector,
    });
    const res = await k8sListResource<TaskRunKind>(
      withKubearchivePathPrefix<K8sResourceListOptions>({
        model: TaskRunModel,
        queryOptions: {
          ...(k8sQueryOptions || {}),
          queryParams: {
            ...(k8sQueryOptions?.queryParams || {}),
            limit: KUBEARCHIVE_RESOURCE_LIMIT,
          },
        },
      }),
    );
    return pickNewestTaskRun(res?.items ?? []);
  }

  const [results] = await getTaskRuns(namespace, { selector, limit: 1 });
  return results[0] ?? null;
}

const mapToConformaResultRow = (
  v: ConformaRule,
  compResult: ComponentConformaResult,
  status: CONFORMA_RESULT_STATUS,
): ConformaResultRow => ({
  title: v.metadata?.title,
  description: v.metadata?.description,
  status,
  timestamp: v.metadata?.effective_on,
  component: compResult.name,
  msg: v.msg,
  collection: v.metadata?.collections,
  solution: v.metadata?.solution,
  images: compResult.containerImage ? [compResult.containerImage] : [],
  code: v.metadata?.code,
});

export const mapConformaResultData = (
  conformaResult: ComponentConformaResult[],
): ConformaResultRow[] => {
  return conformaResult.reduce((acc, compResult) => {
    compResult?.violations?.forEach((v) => {
      acc.push(mapToConformaResultRow(v, compResult, CONFORMA_RESULT_STATUS.violations));
    });
    compResult?.warnings?.forEach((v) => {
      acc.push(mapToConformaResultRow(v, compResult, CONFORMA_RESULT_STATUS.warnings));
    });
    compResult?.successes?.forEach((v) => {
      acc.push(mapToConformaResultRow(v, compResult, CONFORMA_RESULT_STATUS.successes));
    });
    return acc;
  }, [] as ConformaResultRow[]);
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
    queryParams: { container: 'step-report-json' },
  };

  return commonFetchJSON<ConformaResult>(getK8sResourceURL(PodModel, undefined, podLogOpts), {
    pathPrefix: KUBEARCHIVE_PATH_PREFIX,
  });
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
): Promise<ConformaResult | undefined> {
  if (isKubearchiveLogsEnabled) {
    return fetchConformaLogFromKubearchive(namespace, taskRun);
  }
  return fetchConformaLogFromTektonResults(namespace, taskRun);
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
