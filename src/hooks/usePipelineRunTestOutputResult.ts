import { useEffect, useMemo } from 'react';
import { runStatus, TestOutputResult } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import {
  getPipelineRunStatusResults,
  isTaskV1Beta1,
  taskTestResultStatus,
  testOutputResultToRunStatus,
} from '~/utils/pipeline-utils';
import { useTaskRunsForPipelineRuns } from './useTaskRunsV2';

type UsePipelineRunTestOutputResult = [
  runStatus | null,
  boolean, // loading
  string | undefined, // test output result note
];

const TEST_STATUS_RANK_ORDER: Record<string, number> = {
  SUCCESS: 0,
  SKIPPED: 1,
  WARNING: 2,
  FAILURE: 3,
  ERROR: 4,
};

export const usePipelineRunTestOutputResult = (
  namespace: string | null,
  plr: PipelineRunKind,
): UsePipelineRunTestOutputResult => {
  const needsTaskRunFallback = useMemo(() => {
    if (!plr) return false;
    const results = getPipelineRunStatusResults(plr) ?? [];
    const hasPipelineLevelTestOutput = results.some(
      (r) => r.name === 'HACBS_TEST_OUTPUT' || r.name === 'TEST_OUTPUT',
    );
    return !hasPipelineLevelTestOutput;
  }, [plr]);

  const taskRunNamespace = needsTaskRunFallback ? namespace : null;

  const [taskRuns, loaded, error, getNextPage, nextPageProps] = useTaskRunsForPipelineRuns(
    taskRunNamespace,
    plr.metadata?.name ?? null,
    undefined,
    false,
  );

  useEffect(() => {
    if (nextPageProps.hasNextPage && !nextPageProps.isFetchingNextPage && loaded && !error) {
      getNextPage();
    }
  }, [nextPageProps.hasNextPage, nextPageProps.isFetchingNextPage, loaded, getNextPage, error]);

  const testStatus = useMemo(() => {
    if (!plr) return null;

    const results = getPipelineRunStatusResults(plr);
    const testResultStatus = taskTestResultStatus(results ?? []);

    if (testResultStatus) return testResultStatus;

    const testResults = taskRuns
      ?.map((taskRun) => {
        const taskResults = isTaskV1Beta1(taskRun)
          ? taskRun.status?.taskResults
          : taskRun.status?.results;
        return taskTestResultStatus(taskResults ?? []);
      })
      .filter((testResult) => !!testResult)
      .sort((a, b) => {
        const rankA = TEST_STATUS_RANK_ORDER[a.result] ?? -1;
        const rankB = TEST_STATUS_RANK_ORDER[b.result] ?? -1;
        return rankB - rankA;
      });

    return testResults?.[0];
  }, [plr, taskRuns]);

  const convertedStatus = useMemo<runStatus | null>(
    () => testOutputResultToRunStatus(testStatus?.result as TestOutputResult),
    [testStatus?.result],
  );

  // when taskRunNamespace is null we are not fetching task runs (e.g. PLR has TEST_OUTPUT); treat as not loading
  const isLoading =
    taskRunNamespace !== null ? (!loaded && !error) || nextPageProps.isFetchingNextPage : false;

  return [convertedStatus, isLoading, testStatus?.note];
};

export default usePipelineRunTestOutputResult;
