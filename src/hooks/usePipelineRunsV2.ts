import * as React from 'react';
import { differenceBy, uniqBy } from 'lodash-es';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { useK8sWatchResource } from '../k8s';
import { PipelineRunGroupVersionKind, PipelineRunModel } from '../models';
import { useDeepCompareMemoize } from '../shared';
import { PipelineRunKind } from '../types';
import { K8sResourceCommon, MatchExpression, Selector, WatchK8sResource } from '../types/k8s';
import { getCommitSha } from '../utils/commits-utils';
import { EQ } from '../utils/tekton-results';
import { useApplication } from './useApplications';
import { useComponents } from './useComponents';
import { GetNextPage, NextPageProps, useTRPipelineRuns } from './useTektonResults';

type PipelineRunSelector = Selector &
  Partial<{
    filterByName: string;
    filterByCreationTimestampAfter: string;
    filterByCommit: string;
  }>;

export const convertFilterToKubearchiveSelectors = (
  filterBy: PipelineRunSelector,
): Pick<WatchK8sResource, 'fieldSelector' | 'selector'> => {
  const fieldSelectors: Record<string, string> = {};
  if (filterBy.filterByName) fieldSelectors['metadata.name'] = filterBy.filterByName;

  const fieldSelector = Object.keys(fieldSelectors).length
    ? Object.entries(fieldSelectors)
        .map(([k, v]) => `${k}=${v}`)
        .join(',')
    : undefined;

  // Build matchExpressions (including commit filter)
  const matchExpressions: MatchExpression[] = [
    ...(filterBy.matchExpressions ?? []),
    ...(filterBy.filterByCommit
      ? [
          {
            key: PipelineRunLabel.COMMIT_LABEL,
            operator: 'Equals',
            values: [filterBy.filterByCommit],
          },
        ]
      : []),
  ];

  // Build the final selector (excluding custom filter fields)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { filterByName, filterByCreationTimestampAfter, filterByCommit, ...rest } = filterBy;
  const selector: Selector = { ...rest, matchLabels: filterBy.matchLabels, matchExpressions };

  return { selector, fieldSelector };
};

export const createKubearchiveWatchResource = (
  namespace: string | null,
  selector?: PipelineRunSelector,
): {
  namespace: string;
  selector?: Selector;
  fieldSelector?: string;
} => {
  if (!selector) return { namespace };

  const { selector: kubearchiveSelector, fieldSelector } =
    convertFilterToKubearchiveSelectors(selector);

  return {
    namespace,
    selector: kubearchiveSelector,
    fieldSelector,
  };
};

export const usePipelineRunsV2 = <Kind extends K8sResourceCommon>(
  namespace: string | null,
  options?: {
    selector?: PipelineRunSelector;
    limit?: number;
    name?: string;
    watch?: boolean;
    enabled?: boolean;
  },
): [Kind[] | PipelineRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const etcdRunsRef = React.useRef<Kind[]>([]);
  const optionsMemo = useDeepCompareMemoize(options);
  const limit = optionsMemo?.limit;
  const isList = !optionsMemo?.name;
  const kubearchiveEnabled = useIsOnFeatureFlag('pipelineruns-kubearchive');
  // do not include the limit when querying etcd because result order is not sorted
  const watchOptions = React.useMemo(() => {
    // reset cached runs as the options have changed
    etcdRunsRef.current = [];
    return namespace
      ? {
          groupVersionKind: PipelineRunGroupVersionKind,
          namespace,
          isList,
          selector: optionsMemo?.selector,
          name: optionsMemo?.name,
          watch: true,
        }
      : null;
  }, [namespace, isList, optionsMemo?.selector, optionsMemo?.name]);
  const {
    data: resources,
    isLoading,
    error,
  } = useK8sWatchResource<Kind[]>(watchOptions, PipelineRunModel, { retry: false });
  // if a pipeline run was removed from etcd, we want to still include it in the return value without re-querying tekton-results
  const etcdRuns = React.useMemo(() => {
    if (isLoading || error) {
      return [];
    }
    const resourcesArray = (isList ? resources : [resources]) as Kind[];

    if (!options?.selector?.filterByCommit) {
      return resourcesArray;
    }

    return (
      resourcesArray?.filter(
        (plr) =>
          getCommitSha(plr as unknown as PipelineRunKind) === options.selector.filterByCommit,
      ) ?? []
    );
  }, [isList, options?.selector?.filterByCommit, resources, isLoading, error]);

  const runs = React.useMemo(() => {
    if (!etcdRuns) {
      return etcdRuns;
    }
    let value = etcdRunsRef.current
      ? [
          ...etcdRuns,
          // identify the runs that were removed
          ...differenceBy(etcdRunsRef.current, etcdRuns, (plr) => plr.metadata.name),
        ]
      : [...etcdRuns];
    value.sort((a, b) => b.metadata.creationTimestamp.localeCompare(a.metadata.creationTimestamp));
    if (limit && limit < value.length) {
      value = value.slice(0, limit);
    }
    return value;
  }, [etcdRuns, limit]);

  // cache the last set to identify removed runs
  etcdRunsRef.current = runs;

  const processedClusterData = React.useMemo(() => {
    if (isLoading || error || !resources) return [];

    const sorted = [...resources].sort((a, b) =>
      (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
    );

    return sorted;
  }, [resources, isLoading, error]);

  let shouldQuery = true;
  if (options?.limit && processedClusterData.length >= options.limit) {
    shouldQuery = false;
  }

  // Query tekton results if there's no limit or we received less items from etcd than the current limit
  const queryTr =
    !!namespace &&
    !kubearchiveEnabled &&
    shouldQuery &&
    (!limit || (runs && !isLoading && (limit ?? 0) > (runs?.length ?? 0)) || !!error);

  const trOptions: typeof optionsMemo = React.useMemo(() => {
    if (optionsMemo?.name) {
      const { name, ...rest } = optionsMemo;
      return {
        ...rest,
        filter: EQ('data.metadata.name', name),
      };
    }
    return optionsMemo;
  }, [optionsMemo]);

  // tekton-results includes items in etcd, therefore options must use the same limit
  // these duplicates will later be de-duped
  const [trResources, trLoaded, trError, trGetNextPage, nextPageProps] = useTRPipelineRuns(
    queryTr ? namespace : null,
    trOptions,
  );

  //kubearchive results
  const resourceInit = React.useMemo(
    () =>
      kubearchiveEnabled && shouldQuery
        ? {
            groupVersionKind: PipelineRunGroupVersionKind,
            namespace,
            ...createKubearchiveWatchResource(namespace, options?.selector),
            isList: true,
            limit: options?.limit || 200,
          }
        : undefined,
    [namespace, options?.limit, options?.selector, kubearchiveEnabled, shouldQuery],
  );

  const kubearchiveResult = useKubearchiveListResourceQuery(resourceInit, PipelineRunModel);

  const kubearchiveData = React.useMemo(() => {
    const pages = kubearchiveResult.data?.pages;
    const archiveData = pages?.flatMap((page) => page) ?? [];
    // Apply sorting and limit to KubeArchive data
    if (!kubearchiveEnabled) return [];
    const data = archiveData as PipelineRunKind[];
    const toKey = (tr?: PipelineRunKind) => tr?.metadata?.creationTimestamp ?? '';
    // Sort by creationTimestamp (newest first); stable for equal keys
    const sorted = [...data].sort((a, b) => toKey(b).localeCompare(toKey(a)));

    // Apply limit if specified
    return options?.limit && options.limit > 0 ? sorted.slice(0, options.limit) : sorted;
  }, [kubearchiveResult.data?.pages, kubearchiveEnabled, options?.limit]);

  //combine cluster data with tekton results/kubeArchive results based on flag
  let combinedData = !kubearchiveEnabled
    ? uniqBy([...processedClusterData, ...(trResources || [])], (r) => r.metadata?.name)
    : uniqBy([...processedClusterData, ...(kubearchiveData || [])], (r) => r.metadata?.name);

  combinedData.sort((a, b) =>
    (b.metadata?.creationTimestamp || '').localeCompare(a.metadata?.creationTimestamp || ''),
  );

  // Apply limit if specified
  if (options?.limit && options.limit < combinedData.length) {
    combinedData = combinedData.slice(0, options.limit);
  }

  // Return the appropriate data based on feature flag
  return React.useMemo(() => {
    if (kubearchiveEnabled) {
      const isLoadingKubeArchive = !namespace ? false : kubearchiveResult.isLoading;
      const isError = !namespace ? undefined : kubearchiveResult.error;
      const getNextPage: GetNextPage = kubearchiveResult.hasNextPage
        ? () => {
            void kubearchiveResult.fetchNextPage();
          }
        : undefined;
      const nextPagePropsKubeArchive: NextPageProps = {
        hasNextPage: kubearchiveResult.hasNextPage || false,
        isFetchingNextPage: kubearchiveResult.isFetchingNextPage || false,
      };

      return [
        combinedData as PipelineRunKind[],
        !namespace ? false : !(isLoadingKubeArchive || isLoading),
        isError || error,
        getNextPage,
        nextPagePropsKubeArchive,
      ];
    }
    return [
      combinedData as PipelineRunKind[],
      !namespace ? false : (queryTr ? trLoaded : true) && !isLoading,
      trError || error,
      trGetNextPage,
      nextPageProps,
    ];
  }, [
    kubearchiveEnabled,
    trLoaded,
    trError,
    trGetNextPage,
    nextPageProps,
    namespace,
    combinedData,
    error,
    isLoading,
    kubearchiveResult,
    queryTr,
  ]);
};

export const usePipelineRunsForCommitV2 = (
  namespace: string,
  applicationName: string,
  commit: string,
  limit?: number,
  filterByComponents = true,
): [PipelineRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const isKubearchiveEnabled = useIsOnFeatureFlag['pipelineruns-kubearchive'];
  const [components, componentsLoaded] = useComponents(namespace, applicationName);
  const [application] = useApplication(namespace, applicationName);

  const componentNames = React.useMemo(
    () => (componentsLoaded ? components.map((c) => c.metadata?.name) : []),
    [components, componentsLoaded],
  );

  const [pipelineRuns, plrsLoaded, plrError, getNextPage, nextPageProps] = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
          matchLabels: {
            [PipelineRunLabel.APPLICATION]: applicationName,
          },
          matchExpressions:
            filterByComponents && componentNames.length > 0
              ? [{ key: PipelineRunLabel.COMPONENT, operator: 'In', values: componentNames }]
              : [],
          filterByCommit: commit,
        },
        enabled: isKubearchiveEnabled,
        limit: filterByComponents ? limit : undefined,
      }),
      [
        applicationName,
        commit,
        application,
        componentNames,
        filterByComponents,
        limit,
        isKubearchiveEnabled,
      ],
    ),
  );

  return React.useMemo(() => {
    if (!plrsLoaded || plrError) {
      return [[], plrsLoaded, plrError ?? 'Error', undefined, undefined];
    }
    return [pipelineRuns as PipelineRunKind[], plrsLoaded, plrError, getNextPage, nextPageProps];
  }, [
    // usePipelineRunV2 variables
    pipelineRuns,
    plrsLoaded,
    plrError,
    getNextPage,
    nextPageProps,
  ]);
};
