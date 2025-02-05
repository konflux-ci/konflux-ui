import { isEmpty, isPlainObject, pick, toArray } from 'lodash-es';
import { WatchK8sResource } from '../types/k8s';
import type {
  K8sModelCommon,
  K8sResourceCommon,
  QueryOptions,
  QueryParams,
  Selector,
  MatchExpression,
  MatchLabels,
  K8sResourceKindReference,
  GetGroupVersionKindForModel,
  K8sGroupVersionKind,
  K8sStatus,
  QueryOptionsWithSelector,
} from '../types/k8s';
import { WebSocketOptions } from './web-socket/types';
import { WebSocketFactory } from './web-socket/WebSocketFactory';

type CreateQueryParams = Pick<
  QueryParams,
  'pretty' | 'dryRun' | 'fieldManager' | 'fieldValidation'
>;

const FILTERED_CREATE_QUERY_PARAMS: Array<keyof CreateQueryParams> = [
  'pretty',
  'dryRun',
  'fieldManager',
  'fieldValidation',
];

/**
 * Validates if the provided unknown data is of the K8sStatus type.
 * @param data - the unknown data to check.
 * @returns true if data is of the K8sStatus type, otherwise false.
 */
export const isK8sStatus = (data: unknown): data is K8sStatus =>
  isPlainObject(data) && (data as K8sStatus).kind === 'Status';

const getQueryString = (queryParams: QueryParams) =>
  Object.entries(queryParams)
    .map(([key, value = '']) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

const getK8sAPIPath = (
  { apiGroup = 'core', apiVersion }: K8sModelCommon,
  activeWorkspace?: string,
) => {
  let path = '';
  if (activeWorkspace) {
    path += `/workspaces/${activeWorkspace}`;
  }
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  path += isLegacy ? `/api/${apiVersion}` : `/apis/${apiGroup}/${apiVersion}`;
  return path;
};

const requirementToString = (requirement: MatchExpression): string => {
  if (requirement.operator === 'Equals') {
    return `${requirement.key}=${requirement.values?.[0]}`;
  }

  if (requirement.operator === 'NotEquals') {
    return `${requirement.key}!=${requirement.values?.[0]}`;
  }

  if (requirement.operator === 'Exists') {
    return requirement.key;
  }

  if (requirement.operator === 'DoesNotExist') {
    return `!${requirement.key}`;
  }

  if (requirement.operator === 'In') {
    return `${requirement.key} in (${toArray(requirement.values).join(',')})`;
  }

  if (requirement.operator === 'NotIn') {
    return `${requirement.key} notin (${toArray(requirement.values).join(',')})`;
  }

  if (requirement.operator === 'GreaterThan') {
    return `${requirement.key} > ${requirement.values?.[0]}`;
  }

  if (requirement.operator === 'LessThan') {
    return `${requirement.key} < ${requirement.values?.[0]}`;
  }

  return '';
};

const createEquals = (key: string, value: string): MatchExpression => ({
  key,
  operator: 'Equals',
  values: [value],
});

const isOldFormat = (selector: Selector | MatchLabels) =>
  !selector.matchLabels && !selector.matchExpressions;

const toRequirements = (selector: Selector = {}): MatchExpression[] => {
  const requirements: MatchExpression[] = [];
  const matchLabels = isOldFormat(selector) ? selector : selector.matchLabels;
  const { matchExpressions } = selector;

  Object.keys(matchLabels || {})
    .sort()
    .forEach((k) => {
      const value = matchLabels?.[k] as string;
      requirements.push(createEquals(k, value));
    });

  matchExpressions?.forEach((me) => {
    requirements.push(me);
  });

  return requirements;
};

export const selectorToString = (selector: Selector | undefined): string => {
  const requirements = toRequirements(selector);
  return requirements.map(requirementToString).join(',');
};

/**
 * Builds a k8s resource URL to the provided model, augmented with the resource or query metadata.
 * @param model - the model of the resource you want to connect to
 * @param resource - inspected if you provide it for metadata attributes
 * @param queryOptions - additional and alternative configuration for the URL
 * @param queryOptions.ns - namespace, if omitted resource.metadata.namespace
 * @param queryOptions.name - name, if omitted resource.metadata.name
 * @param queryOptions.path - additional path you want on the end
 * @param queryOptions.queryParams - any additional query params you way want
 * @param isCreate - boolean indicating if the resulting URL will be used for resource creation
 */
export const getK8sResourceURL = (
  model: K8sModelCommon,
  resource?: K8sResourceCommon,
  queryOptions: Partial<QueryOptionsWithSelector> = {},
  isCreate = false,
) => {
  const { ns, name, path, queryParams } = queryOptions;
  let resourcePath = getK8sAPIPath(model, queryOptions.ws);

  if (resource?.metadata?.namespace) {
    resourcePath += `/namespaces/${resource.metadata.namespace}`;
  } else if (ns) {
    resourcePath += `/namespaces/${ns}`;
  }

  if (resource?.metadata?.namespace && ns && resource.metadata.namespace !== ns) {
    throw new Error('Resource payload namespace vs. query options namespace mismatch');
  }

  resourcePath += `/${model.plural}`;

  if (!isCreate) {
    if (resource?.metadata?.name) {
      resourcePath += `/${encodeURIComponent(resource.metadata.name)}`;
    } else if (name) {
      resourcePath += `/${encodeURIComponent(name)}`;
    }

    if (resource?.metadata?.name && name && resource.metadata.name !== name) {
      throw new Error('Resource payload name vs. query options name mismatch');
    }
  }

  if (path) {
    resourcePath += `/${path}`;
  }

  const filteredQueryParams: QueryOptions['queryParams'] = isCreate
    ? pick(queryParams, FILTERED_CREATE_QUERY_PARAMS)
    : queryParams;
  if (queryOptions?.queryParams?.labelSelector) {
    filteredQueryParams.labelSelector =
      typeof queryOptions.queryParams.labelSelector !== 'string'
        ? selectorToString(queryOptions.queryParams.labelSelector)
        : queryOptions.queryParams.labelSelector;
  }

  if (filteredQueryParams && !isEmpty(filteredQueryParams)) {
    resourcePath += `?${getQueryString(filteredQueryParams)}`;
  }
  return resourcePath;
};

/**
 * returns websocket subprotocol, host with added prefix to path
 * @param path {String}
 */
export const getWebsocketSubProtocolAndPathPrefix = (path: string) => {
  return {
    path: path === '' ? undefined : `/wss/k8s${path.startsWith('/') ? path : `/${path}`}`,
    host: 'auto',
    subProtocols: ['base64.binary.k8s.io'],
  };
};

export const k8sWatch = (
  kind: K8sModelCommon,
  query: {
    labelSelector?: Selector;
    resourceVersion?: string;
    ns?: string;
    fieldSelector?: string;
    ws?: string;
  } = {},
  options: Partial<
    WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }
  > = {},
) => {
  const queryParams: QueryParams<Selector> = { watch: 'true' };
  const opts: {
    queryParams: QueryParams<Selector>;
    ns?: string;
    ws?: string;
  } = { queryParams };
  const wsOptionsUpdated: WebSocketOptions = {
    path: '',
    reconnect: true,
    jsonParse: true,
    bufferFlushInterval: 500,
    bufferMax: 1000,
    ...options,
  };

  const { labelSelector } = query;
  if (labelSelector) {
    queryParams.labelSelector =
      typeof labelSelector === 'string' ? labelSelector : { ...labelSelector };
  }

  if (query.fieldSelector) {
    queryParams.fieldSelector = query.fieldSelector;
  }

  if (query.ns) {
    opts.ns = query.ns;
  }

  if (query.ws) {
    opts.ws = query.ws;
  }

  if (query.resourceVersion) {
    queryParams.resourceVersion = query.resourceVersion;
  }

  const path = getK8sResourceURL(kind, undefined, opts);

  return new WebSocketFactory(path, {
    ...wsOptionsUpdated,
    ...getWebsocketSubProtocolAndPathPrefix(path),
  });
};

/**
 * Provides a group, version, and kind for a k8s model.
 * @param model - k8s model
 * @returns The group, version, kind for the provided model.
 * If the model does not have an apiGroup, group "core" will be returned.
 */
export const getGroupVersionKindForModel: GetGroupVersionKindForModel = ({
  apiGroup,
  apiVersion,
  kind,
}) => ({
  ...(apiGroup && { group: apiGroup }),
  apiVersion,
  kind,
});

/**
 * @deprecated - This will become obsolete when we move away from K8sResourceKindReference to K8sGroupVersionKind
 * Provides a reference string that uniquely identifies the group, version, and kind of a k8s resource.
 * @param K8sGroupVersionKind - Pass K8sGroupVersionKind which will have group, version, and kind of a k8s resource.
 * @param K8sGroupVersionKind.group - Pass group of k8s resource or model.
 * @param K8sGroupVersionKind.version - Pass version of k8s resource or model.
 * @param K8sGroupVersionKind.kind - Pass kind of k8s resource or model.
 * @returns The reference for any k8s resource i.e `group~version~kind`.
 * If the group will not be present then "core" will be returned as part of the group in reference.
 */
export const getReference = ({
  group,
  version,
  kind,
}: K8sGroupVersionKind): K8sResourceKindReference => [group || 'core', version, kind].join('~');

export const convertToK8sQueryParams = (
  resourceInit: WatchK8sResource,
): QueryOptionsWithSelector => {
  if (!resourceInit) {
    return undefined;
  }
  const queryParams: QueryOptionsWithSelector['queryParams'] = {};

  if (!isEmpty(resourceInit.selector)) {
    queryParams.labelSelector = resourceInit.selector;
  }
  if (!isEmpty(resourceInit.fieldSelector)) {
    queryParams.fieldSelector = resourceInit.fieldSelector;
  }
  if (resourceInit.limit) {
    queryParams.limit = resourceInit.limit;
  }
  return {
    ns: resourceInit.namespace,
    name: resourceInit.name,
    ws: resourceInit.workspace,
    queryParams,
  };
};
