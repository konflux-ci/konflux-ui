import { curry } from 'lodash-es';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { commonFetchJSON, commonFetchText } from '../k8s';
import { PipelineRunModel, TaskRunModel } from '../models';
import { PipelineRunKindV1Beta1, TaskRunKindV1Beta1 } from '../types';
import {
  K8sModelCommon,
  K8sResourceCommon,
  MatchExpression,
  MatchLabels,
  Selector,
} from '../types/k8s';

// REST API spec
// https://github.com/tektoncd/results/blob/main/docs/api/rest-api-spec.md

const URL_PREFIX = `/plugins/tekton-results/apis/results.tekton.dev/v1alpha2/parents`;

const MINIMUM_PAGE_SIZE = 5;
const MAXIMUM_PAGE_SIZE = 10000;

export type Record = {
  name: string;
  uid: string;
  createTime: string;
  updateTime: string;
  etag: string;
  data: {
    // tekton.dev/v1beta1.PipelineRun | tekton.dev/v1beta1.TaskRun | results.tekton.dev/v1alpha2.Log
    type: string;
    value: string;
  };
};

export type Log = {
  result: {
    name: string;
    data: string;
  };
};

export type RecordsList = {
  nextPageToken?: string;
  records: Record[];
};

export type TektonResultsOptions = {
  pageSize?: number;
  selector?: Selector;
  // limit cannot be used in conjuction with pageSize and takes precedence
  limit?: number;
  filter?: string;
};

const throw404 = () => {
  throw { code: 404 };
};

// decoding result base64
export const decodeValue = (value: string) => atob(value);
export const decodeValueJson = (value: string) => (value ? JSON.parse(decodeValue(value)) : null);

// filter functions
export const AND = (...expressions: string[]) => expressions.filter((x) => x).join(' && ');
export const OR = (...expressions: string[]) => {
  const filteredExpressions = expressions.filter((x) => x);
  const filter = filteredExpressions.join(' || ');
  return filteredExpressions.length > 1 ? `(${filter})` : filter;
};

const EXP = (left: string, right: string, operator: string) => `${left} ${operator} ${right}`;
export const EQ = (left: string, right: string) => EXP(left, `"${right}"`, '==');
export const NEQ = (left: string, right: string) => EXP(left, `"${right}"`, '!=');
export const IN = (left: string, right: string[]) => {
  const rightOperands = right.map((operand) => `"${operand.toString()}"`);
  return EXP(left, `[${rightOperands.join(',')}]`, 'in');
};

// TODO: switch to v1 once API is ready
// https://github.com/tektoncd/community/pull/1055
export enum DataType {
  PipelineRun = 'tekton.dev/v1.PipelineRun',
  TaskRun = 'tekton.dev/v1.TaskRun',
  Log = 'results.tekton.dev/v1alpha3.Log',
  PipelineRun_v1beta1 = 'tekton.dev/v1beta1.PipelineRun',
  TaskRun_v1beta1 = 'tekton.dev/v1beta1.TaskRun',
  Log_v1alpha2 = 'results.tekton.dev/v1alpha2.Log',
}

export const labelsToFilter = (labels?: MatchLabels): string =>
  labels
    ? AND(
        ...Object.keys(labels).map((label) =>
          EQ(`data.metadata.labels["${label}"]`, labels[label]),
        ),
      )
    : '';

export const nameFilter = (name?: string): string =>
  name ? AND(`data.metadata.name.contains("${name.trim().toLowerCase()}")`) : '';

export const commitShaFilter = (commitSha: string): string =>
  OR(
    EQ(`data.metadata.labels["${PipelineRunLabel.COMMIT_LABEL}"]`, commitSha),
    EQ(`data.metadata.labels["${PipelineRunLabel.TEST_SERVICE_COMMIT}"]`, commitSha),
    EQ(`data.metadata.annotations["${PipelineRunLabel.COMMIT_ANNOTATION}"]`, commitSha),
  );

export const creationTimestampFilterAfter = (creationTimestamp: string): string => {
  return Date.parse(creationTimestamp)
    ? EXP(`data.metadata.creationTimestamp`, `"${creationTimestamp}"`, '>')
    : '';
};

export const expressionsToFilter = (expressions: Omit<MatchExpression, 'value'>[]): string =>
  AND(
    ...expressions
      .map((expression) => {
        switch (expression.operator) {
          case 'Exists':
            return `data.metadata.labels.contains("${expression.key}")`;
          case 'DoesNotExist':
            return `!data.metadata.labels.contains("${expression.key}")`;
          case 'NotIn':
            return expression.values?.length > 0
              ? AND(
                  ...expression.values.map((value) =>
                    NEQ(`data.metadata.labels["${expression.key}"]`, value),
                  ),
                )
              : '';
          case 'In':
            return expression.values?.length > 0
              ? // eslint-disable-next-line
                `data.metadata.labels["${expression.key}"] in [${expression.values.map(
                  (value) => `"${value}"`,
                )}]`
              : '';
          case 'Equals':
            return expression.values?.[0]
              ? EQ(`data.metadata.labels["${expression.key}"]`, expression.values?.[0])
              : '';
          case 'NotEquals':
          case 'NotEqual':
            return expression.values?.[0]
              ? NEQ(`data.metadata.labels["${expression.key}"]`, expression.values?.[0])
              : '';
          case 'GreaterThan':
            return expression.values?.[0]
              ? EXP(`data.metadata.labels["${expression.key}"]`, expression.values?.[0], '>')
              : '';
          case 'LessThan':
            return expression.values?.[0]
              ? EXP(`data.metadata.labels["${expression.key}"]`, expression.values?.[0], '<')
              : '';
          default:
            throw new Error(
              `Tekton results operator '${expression.operator}' conversion not implemented.`,
            );
        }
      })
      .filter((x) => x),
  );

export const selectorToFilter = (selector?: Selector) => {
  let filter = '';
  if (selector) {
    const {
      matchLabels,
      matchExpressions,
      filterByName,
      filterByCommit,
      filterByCreationTimestampAfter,
    } = selector;

    if (filterByCreationTimestampAfter) {
      filter = AND(filter, creationTimestampFilterAfter(filterByCreationTimestampAfter as string));
    }

    if (filterByName) {
      filter = AND(filter, nameFilter(filterByName as string));
    }

    if (filterByCommit) {
      filter = AND(filter, commitShaFilter(filterByCommit as string));
    }

    if (matchLabels || matchExpressions) {
      if (matchLabels) {
        filter = AND(filter, labelsToFilter(matchLabels));
      }
      if (matchExpressions) {
        filter = AND(filter, expressionsToFilter(matchExpressions));
      }
    }
  }
  return filter;
};

// Devs should be careful to not cache a response that may not be complete.
// In most situtations, caching is unnecessary.
// Only cache a response that returns a single complete record as lists can change over time.
let CACHE: { [key: string]: [unknown[], RecordsList] } = {};
export const clearCache = () => {
  CACHE = {};
};
const InFlightStore: { [key: string]: boolean } = {};

const commonFields = [
  'records.name',
  'records.data.value.apiVersion',
  'records.data.value.kind',
  'records.data.value.metadata.annotations',
  'records.data.value.metadata.labels',
  'records.data.value.metadata.name',
  'records.data.value.metadata.namespace',
  'records.data.value.metadata.uid',
  'records.data.value.metadata.creationTimestamp',
  'records.data.value.metadata.ownerReferences',
  'records.data.value.status.conditions',
  'records.data.value.status.results',
  'records.data.value.status.startTime',
  'records.data.value.status.completionTime',
  'next_page_token',
];

const remainingTaskrunFields = [
  'records.data.value.status.podName',
  'records.data.value.status.taskSpec.description',
  'records.data.value.spec.taskRef.params',
  'records.data.value.spec.taskRef.name',
  'records.data.value.spec.containers',
  'records.data.value.spec.status',
  'records.data.value.status.taskResults',
  'records.data.value.status.containerStatuses',
];

const remainingPipelinerunFields = [
  'records.data.value.spec.params',
  'records.data.value.status.pipelineSpec.tasks',
  'records.data.value.status.pipelineSpec.finally',
  'records.data.value.status.pipelineResults',
];

export const createTektonResultsUrl = (
  namespace: string,
  dataTypes: DataType[],
  filter?: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
): string =>
  `${URL_PREFIX}/${namespace}/results/-/records?${new URLSearchParams({
    // default sort should always be by `create_time desc`
    ['order_by']: 'create_time desc',
    ['page_size']: `${Math.max(
      MINIMUM_PAGE_SIZE,
      Math.min(MAXIMUM_PAGE_SIZE, options?.limit >= 0 ? options.limit : options?.pageSize ?? 30),
    )}`,
    ...(nextPageToken ? { ['page_token']: nextPageToken } : {}),
    // get partial response with required fields
    ['PartialResponse']: 'true',
    ['fields']: dataTypes.every((item) => item.includes('PipelineRun'))
      ? [...commonFields, ...remainingPipelinerunFields].join(',')
      : [...commonFields, ...remainingTaskrunFields].join(','),
    filter: AND(
      IN('data_type', dataTypes),
      filter,
      selectorToFilter(options?.selector),
      options?.filter,
    ),
  }).toString()}`;

export const getFilteredRecord = async <R extends K8sResourceCommon>(
  namespace: string,
  dataTypes: DataType[],
  filter?: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  cacheKey?: string,
): Promise<[R[], RecordsList, boolean?]> => {
  const url = createTektonResultsUrl(namespace, dataTypes, filter, options, nextPageToken);

  if (cacheKey) {
    const result = CACHE[cacheKey];
    if (result) {
      return result as unknown as [R[], RecordsList];
    }
    if (InFlightStore[cacheKey]) {
      return [
        [],
        {
          nextPageToken: null,
          records: [],
        },
        true,
      ];
    }
  }
  InFlightStore[cacheKey] = true;
  const value = await (async (): Promise<[R[], RecordsList]> => {
    try {
      let list: RecordsList = await commonFetchJSON(url);
      if (options?.limit >= 0) {
        list = {
          nextPageToken: null,
          records: (list?.records ?? []).slice(0, options.limit),
        };
      }
      return [(list?.records ?? []).map((result) => decodeValueJson(result.data.value)), list];
    } catch (e) {
      // return an empty response if we get a 404 error
      if (e?.code === 404) {
        return [
          [],
          {
            nextPageToken: null,
            records: [],
          },
        ] as [R[], RecordsList];
      }
      throw e;
    }
  })();

  if (cacheKey) {
    InFlightStore[cacheKey] = false;
    CACHE[cacheKey] = value;
  }
  return value;
};

const getFilteredPipelineRuns = async (
  namespace: string,
  filter: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  cacheKey?: string,
): Promise<[PipelineRunKindV1Beta1[], RecordsList]> => {
  const [originalPipelineRuns, list] = await getFilteredRecord<PipelineRunKindV1Beta1>(
    namespace,
    [DataType.PipelineRun, DataType.PipelineRun_v1beta1],
    filter,
    options,
    nextPageToken,
    cacheKey,
  );

  /*
  When pipelineruns are running, the etcd would keep their results.
  While the tekton record would keep the conditions as:
  "conditions": [
    {
      "type": "Unknown",
      "reason": "Succeeded",
      "status": "Running",
    ...
  Deleting pipelines from etcd makes the tekton record would be never updated as others.
  So for those tekton results, it is useless to users and we need to filter them out.
  Otherwise, these jobs would be always shown as 'Running' and bring unexpected troubles.
  */
  const filteredPipelineRuns = originalPipelineRuns?.filter((pipelinerun) => {
    return (
      pipelinerun?.status?.conditions?.every(
        (c) => !(c.status === 'Unknown' && c.type === 'Succeeded' && c.reason === 'Running'),
      ) ?? true
    );
  });
  return [filteredPipelineRuns, list];
};

const getFilteredTaskRuns = (
  namespace: string,
  filter: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  cacheKey?: string,
) =>
  getFilteredRecord<TaskRunKindV1Beta1>(
    namespace,
    [DataType.TaskRun, DataType.TaskRun_v1beta1],
    filter,
    options,
    nextPageToken,
    cacheKey,
  );

export const getPipelineRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  // supply a cacheKey only if the PipelineRun is complete and response will never change in the future
  cacheKey?: string,
) => getFilteredPipelineRuns(namespace, '', options, nextPageToken, cacheKey);

export const getTaskRuns = (
  namespace: string,
  options?: TektonResultsOptions,
  nextPageToken?: string,
  // supply a cacheKey only if the TaskRun is complete and response will never change in the future
  cacheKey?: string,
) => getFilteredTaskRuns(namespace, '', options, nextPageToken, cacheKey);

// const getLog = (workspace: string, taskRunPath: string) =>
//   commonFetchText(`${getTRUrlPrefix(workspace)}/${taskRunPath.replace('/records/', '/logs/')}`);

export const getTaskRunLog = (namespace: string, taskRunID: string, pid: string): Promise<string> =>
  commonFetchText(`${URL_PREFIX}/${namespace}/results/${pid}/logs/${taskRunID}`).catch(() =>
    throw404(),
  );

export const createTektonResultsQueryKeys = (
  model: K8sModelCommon,
  selector: Selector,
  filter: string,
) => {
  const selectorFilter = selectorToFilter(selector);
  return [
    'tekton-results',
    { group: model.apiGroup, version: model.apiVersion, kind: model.kind },
    ...(selectorFilter ? [selectorFilter] : []),
    ...(filter ? [filter] : []),
  ];
};

export const createTektonResultQueryOptions = curry(
  (fetchFn, model: K8sModelCommon, namespace: string, options: TektonResultsOptions) => {
    return {
      queryKey: createTektonResultsQueryKeys(model, options?.selector, options?.filter),
      queryFn: async ({ pageParam }) => {
        const trData = await fetchFn(namespace, options, pageParam as string);
        return { data: trData[0], nextPage: trData[1].nextPageToken || trData[1].next_page_token };
      },
      enabled: !!namespace,
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.nextPage || undefined,
      staleTime: 1000 * 60 * 5,
    };
  },
);

export const createPipelineRunTektonResultsQueryOptions = createTektonResultQueryOptions(
  getPipelineRuns,
  PipelineRunModel,
);
export const createTaskRunTektonResultsQueryOptions = createTektonResultQueryOptions(
  getTaskRuns,
  TaskRunModel,
);
