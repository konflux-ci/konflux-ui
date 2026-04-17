import { useEffect, useMemo } from 'react';
import { PipelineRunKind } from '~/types';
import {
  getPipelineRunStatusResults,
  isTaskV1Beta1,
  TaskTestResult,
  taskTestResultStatus,
} from '~/utils/pipeline-utils';
import { useTaskRunsForPipelineRuns } from './useTaskRunsV2';

type UsePipelineRunTestOutputResult = [
  AggregatedTestResult | null, // aggregated test result from task runs (successes, failures, warnings)
  boolean, // loading
];

export type AggregatedTestResult = {
  successes: number;
  failures: number;
  warnings: number;
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

  const testStatuses = useMemo<TaskTestResult[] | null>(() => {
    if (!plr) return null;

    const results = getPipelineRunStatusResults(plr);
    const testResultStatus = taskTestResultStatus(results ?? []);

    if (testResultStatus) return [testResultStatus];

    const testResults = taskRuns
      ?.map((taskRun) => {
        const taskResults = isTaskV1Beta1(taskRun)
          ? taskRun.status?.taskResults
          : taskRun.status?.results;
        return taskTestResultStatus(taskResults ?? []);
      })
      .filter((testResult) => !!testResult);

    return testResults;
  }, [plr, taskRuns]);

  const aggregatedTestResult = useMemo<AggregatedTestResult | null>(() => {
    if (!testStatuses || testStatuses.length === 0) return null;

    let hasAnyNumericField = false;
    const aggregated = testStatuses.reduce<AggregatedTestResult>(
      (acc, testResultStatus) => {
        if (testResultStatus) {
          if (testResultStatus.successes !== undefined) {
            acc.successes += testResultStatus.successes;
            hasAnyNumericField = true;
          }
          if (testResultStatus.failures !== undefined) {
            acc.failures += testResultStatus.failures;
            hasAnyNumericField = true;
          }
          if (testResultStatus.warnings !== undefined) {
            acc.warnings += testResultStatus.warnings;
            hasAnyNumericField = true;
          }
        }
        return acc;
      },
      { successes: 0, failures: 0, warnings: 0 },
    );

    return hasAnyNumericField ? aggregated : null;
  }, [testStatuses]);

  // when taskRunNamespace is null we are not fetching task runs (e.g. PLR has TEST_OUTPUT); treat as not loading
  const isLoading =
    taskRunNamespace !== null ? (!loaded && !error) || nextPageProps.isFetchingNextPage : false;

  return [aggregatedTestResult, isLoading];
};

export default usePipelineRunTestOutputResult;
