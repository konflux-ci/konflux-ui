import * as React from 'react';
import { InfiniteData } from '@tanstack/react-query';
import { difference, merge, uniq } from 'lodash-es';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useKubearchiveListResourceQuery } from '~/kubearchive/hooks';
import { TaskRunGroupVersionKind, TaskRunModel } from '~/models';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { useNamespace } from '../shared/providers/Namespace';
import { TektonResourceLabel, TaskRunKind, PipelineRunKind } from '../types';
import { isTaskV1Beta1 } from '../utils/pipeline-utils';
import {
  CVE_SCAN_RESULT_FIELDS,
  isCVEScanResult,
  ScanResults,
  SCAN_OUTPUT,
  SCAN_RESULT,
  SCAN_RESULTS,
  CVE_SCAN_RESULT,
  TEKTON_SCAN_RESULTS,
} from '../utils/scan/scan-utils';
import { OR } from '../utils/tekton-results';
import { useTaskRunsForPipelineRuns } from './useTaskRunsV2';
import { useTRTaskRuns } from './useTektonResults';

export {
  CVE_SCAN_RESULT_FIELDS,
  isCVEScanResult,
  SCAN_OUTPUT,
  SCAN_RESULT,
  SCAN_RESULTS,
  CVE_SCAN_RESULT,
  TEKTON_SCAN_RESULTS,
};
export type { ScanResults };

export const getScanResults = (taskRuns: TaskRunKind[]): [ScanResults, TaskRunKind[]] => {
  const scanResults = taskRuns.reduce(
    (acc, scanTaskRun) => {
      const results = isTaskV1Beta1(scanTaskRun)
        ? scanTaskRun?.status?.taskResults
        : scanTaskRun?.status?.results;
      const taskScanResult = results?.find((result) => isCVEScanResult(result));
      if (taskScanResult) {
        acc[1].push(scanTaskRun);
        try {
          const resultObj: ScanResults = JSON.parse(taskScanResult.value);
          acc[0].vulnerabilities.critical += resultObj.vulnerabilities?.critical ?? 0;
          acc[0].vulnerabilities.high += resultObj.vulnerabilities?.high ?? 0;
          acc[0].vulnerabilities.medium += resultObj.vulnerabilities?.medium ?? 0;
          acc[0].vulnerabilities.low += resultObj.vulnerabilities?.low ?? 0;
          acc[0].vulnerabilities.unknown += resultObj.vulnerabilities?.unknown ?? 0;
        } catch (e) {
          // ignore
        }
      }
      return acc;
    },
    [
      {
        vulnerabilities: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          unknown: 0,
        },
      },
      [],
    ] as [ScanResults, TaskRunKind[]],
  );

  if (scanResults[1].length) {
    return scanResults;
  }
  return [null, []];
};

const processScanTaskRuns = (taskRuns: TaskRunKind[]): ScanResults => {
  const scanTaskRuns = taskRuns.filter((tr) => {
    const results = isTaskV1Beta1(tr) ? tr.status?.taskResults : tr.status?.results;
    return results?.some((result) => CVE_SCAN_RESULT_FIELDS.includes(result.name));
  });

  const [resultObj] = getScanResults(scanTaskRuns);
  return resultObj;
};

export const useScanResults = (pipelineRunName: string): [ScanResults, boolean, unknown] => {
  const namespace = useNamespace();
  const [taskRuns, loaded, error, getNextPage, nextPageProps] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRunName,
    undefined,
    false, // Don't watch - scan results are for completed pipeline runs
  );

  React.useEffect(() => {
    if (nextPageProps.hasNextPage && !nextPageProps.isFetchingNextPage && loaded && !error) {
      getNextPage();
    }
  }, [nextPageProps.hasNextPage, nextPageProps.isFetchingNextPage, loaded, getNextPage, error]);

  return React.useMemo(() => {
    if (
      !loaded ||
      !pipelineRunName ||
      nextPageProps.isFetchingNextPage ||
      nextPageProps.hasNextPage ||
      error
    ) {
      return [undefined, loaded, error];
    }

    const resultObj = processScanTaskRuns(taskRuns);

    return [resultObj, loaded, error];
  }, [
    loaded,
    pipelineRunName,
    taskRuns,
    error,
    nextPageProps.isFetchingNextPage,
    nextPageProps.hasNextPage,
  ]);
};

const dataSelectorForScanResults = (data: InfiniteData<TaskRunKind[], unknown>): ScanResults => {
  const taskRuns = data?.pages?.flatMap((page) => page) ?? [];
  return processScanTaskRuns(taskRuns);
};
export const useKarchScanResults = (pipelineRunName: string): [ScanResults, boolean, unknown] => {
  const namespace = useNamespace();

  const karchRes = useKubearchiveListResourceQuery(
    {
      groupVersionKind: TaskRunGroupVersionKind,
      isList: true,
      namespace,
      selector: {
        matchLabels: {
          [TektonResourceLabel.pipelinerun]: pipelineRunName,
        },
      },
    },
    TaskRunModel,
    { enabled: !!pipelineRunName, staleTime: Infinity, select: dataSelectorForScanResults },
  );

  React.useEffect(() => {
    if (
      karchRes.hasNextPage &&
      !karchRes.isFetchingNextPage &&
      !karchRes.isLoading &&
      !karchRes.isError
    ) {
      void karchRes.fetchNextPage();
    }
  }, [karchRes]);

  return [karchRes.data, !karchRes.isLoading, karchRes.error];
};

export const getScanResultsMap = (
  taskRuns: TaskRunKind[],
): { [key: string]: [ScanResults, TaskRunKind[]] } => {
  const scanResults = taskRuns.reduce((acc, scanTaskRun) => {
    const results = isTaskV1Beta1(scanTaskRun)
      ? scanTaskRun?.status?.taskResults
      : scanTaskRun?.status?.results;
    const taskScanResult = results?.find((result) => isCVEScanResult(result));
    const pipelineRunName = scanTaskRun.metadata?.labels?.[PipelineRunLabel.PIPELINERUN_NAME];
    if (!acc[pipelineRunName]) {
      acc[pipelineRunName] = [
        {
          vulnerabilities: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            unknown: 0,
          },
        },
        [],
      ];
    }

    if (taskScanResult) {
      acc[pipelineRunName][1].push(scanTaskRun);
      try {
        const resultObj: ScanResults = JSON.parse(taskScanResult.value);
        acc[pipelineRunName][0].vulnerabilities.critical +=
          resultObj.vulnerabilities?.critical ?? 0;
        acc[pipelineRunName][0].vulnerabilities.high += resultObj.vulnerabilities?.high ?? 0;
        acc[pipelineRunName][0].vulnerabilities.medium += resultObj.vulnerabilities?.medium ?? 0;
        acc[pipelineRunName][0].vulnerabilities.low += resultObj.vulnerabilities?.low ?? 0;
        acc[pipelineRunName][0].vulnerabilities.unknown += resultObj.vulnerabilities?.unknown ?? 0;
      } catch (e) {
        // ignore
      }
    }
    return acc;
  }, {});

  if (Object.values(scanResults).length) {
    return scanResults;
  }
  return null;
};

export const usePLRScanResults = (
  pipelineRunNames: string[],
): [{ [key: string]: unknown }, boolean, string[], unknown] => {
  // Fetch directly from tekton-results because a task result is only present on completed tasks runs.
  const cacheKey = React.useRef('');
  React.useEffect(() => {
    if (pipelineRunNames.length) cacheKey.current = pipelineRunNames.sort().join('|');
  }, [pipelineRunNames]);

  const namespace = useNamespace();
  const kubearchiveEnabled = useIsOnFeatureFlag('taskruns-kubearchive');
  // Fetch directly from tekton-results because a task result is only present on completed tasks runs.
  const [taskRuns, loaded, error, getNextPage, nextPageProps] = useTRTaskRuns(
    pipelineRunNames.length > 0 && !kubearchiveEnabled ? namespace : null,
    React.useMemo(
      () => ({
        filter: OR(
          ...CVE_SCAN_RESULT_FIELDS.map((field) => `data.status.taskResults.contains("${field}")`),
          ...CVE_SCAN_RESULT_FIELDS.map((field) => `data.status.results.contains("${field}")`),
        ),
        selector: {
          matchExpressions: [
            {
              key: `${TektonResourceLabel.pipelinerun}`,
              operator: 'In',
              values: pipelineRunNames?.map((name) => name),
            },
          ],
        },
      }),
      [pipelineRunNames],
    ),
  );

  React.useEffect(() => {
    if (nextPageProps.hasNextPage && !nextPageProps.isFetchingNextPage && loaded && !error) {
      getNextPage();
    }
  }, [nextPageProps, getNextPage, loaded, error]);

  return React.useMemo(() => {
    if (!loaded || !pipelineRunNames) {
      return [null, loaded, [], error];
    }
    const scanResultsMap = getScanResultsMap(taskRuns);
    return [
      scanResultsMap,
      loaded,
      loaded && pipelineRunNames.sort().join('|') === cacheKey.current ? pipelineRunNames : [],
      error,
    ];
  }, [loaded, pipelineRunNames, taskRuns, error]);
};

export const usePLRVulnerabilities = (
  pipelineRuns: PipelineRunKind[],
): {
  vulnerabilities: { [key: string]: [ScanResults, TaskRunKind[]] };
  fetchedPipelineRuns: string[];
  error: unknown;
} => {
  const pageSize = 30;
  const processedPipelineruns = React.useRef([]);

  const loadedPipelineRunNames = React.useRef([]);
  const [currentPage, setCurrentPage] = React.useState(-1);
  const pipelineRunVulnerabilities = React.useRef({});

  const addLoadedPipelineruns = (pipelienRunNames: string[]): void => {
    loadedPipelineRunNames.current = uniq([...loadedPipelineRunNames.current, ...pipelienRunNames]);
  };

  // enable cache only if the pipeline run has completed
  const [vulnerabilities, vloaded, vlist, error] = usePLRScanResults(
    difference<string>(
      processedPipelineruns.current.slice(
        (currentPage - 1) * pageSize,
        processedPipelineruns.current.length,
      ),
      loadedPipelineRunNames.current,
    ),
  );
  if ((vloaded && vulnerabilities) || error) {
    pipelineRunVulnerabilities.current = merge(
      {},
      vulnerabilities,
      pipelineRunVulnerabilities.current,
    );
  }

  if (vloaded && vlist.length > 0) {
    addLoadedPipelineruns(vlist);
  }

  React.useEffect(() => {
    const totalPlrs = pipelineRuns.length;
    if (totalPlrs > 0) {
      const completedPipelineRuns = pipelineRuns.filter((plr) => !!plr?.status?.completionTime);
      processedPipelineruns.current = uniq(
        completedPipelineRuns.map(({ metadata: { name } }) => name),
      );

      setCurrentPage(Math.round(totalPlrs / pageSize));
    }
  }, [pipelineRuns]);

  return {
    vulnerabilities: pipelineRunVulnerabilities.current,
    fetchedPipelineRuns: loadedPipelineRunNames.current,
    error,
  };
};
