import React from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { STALE_TIME } from './const';
import { IssueCounts, IssueQuery, IssueSeverity, IssueState, IssueType } from './issue-type';
import { createGetIssueQueryOptions, createInfiniteIssueQueryOptions } from './kite-query';

export const useIssues = (issueQuery: IssueQuery) => {
  return useQuery(createGetIssueQueryOptions(issueQuery));
};

export const useInfiniteIssues = (issueQuery: IssueQuery) => {
  return useInfiniteQuery(createInfiniteIssueQueryOptions(issueQuery));
};

export const useIssueCountsBySeverity = (namespace: string, noRefetch?: boolean): IssueCounts => {
  const baseQuery: IssueQuery = {
    namespace,
    limit: 1,
    state: IssueState.ACTIVE,
  };

  const queryOptions = noRefetch
    ? {
        staleTime: STALE_TIME,
        refetchOnMount: false as const,
      }
    : null;

  const criticalResult = useQuery(
    createGetIssueQueryOptions({ severity: IssueSeverity.CRITICAL, ...baseQuery }, queryOptions),
  );
  const majorResult = useQuery(
    createGetIssueQueryOptions({ severity: IssueSeverity.MAJOR, ...baseQuery }, queryOptions),
  );
  const minorResult = useQuery(
    createGetIssueQueryOptions({ severity: IssueSeverity.MINOR, ...baseQuery }, queryOptions),
  );
  const infoResult = useQuery(
    createGetIssueQueryOptions({ severity: IssueSeverity.INFO, ...baseQuery }, queryOptions),
  );

  return React.useMemo(() => {
    const allResults = [criticalResult, majorResult, minorResult, infoResult];

    const isLoaded = allResults.every((result) => !result.isLoading);
    const error = allResults.find((result) => result.error)?.error;

    if (!isLoaded || error) {
      return { counts: undefined, isLoaded, error };
    }

    return {
      counts: {
        critical: criticalResult.data?.total,
        major: majorResult.data?.total,
        minor: minorResult.data?.total,
        info: infoResult.data?.total,
      },
      isLoaded,
      error,
    };
  }, [criticalResult, majorResult, minorResult, infoResult]);
};

export const useIssueCountsByType = (namespace: string): IssueCounts => {
  const baseQuery: IssueQuery = {
    namespace,
    limit: 1,
  };

  const buildResult = useIssues({ issueType: IssueType.BUILD, ...baseQuery });
  const testResult = useIssues({ issueType: IssueType.TEST, ...baseQuery });
  const releaseResult = useIssues({ issueType: IssueType.RELEASE, ...baseQuery });
  const dependencyResult = useIssues({ issueType: IssueType.DEPENDENCY, ...baseQuery });
  const pipelineResult = useIssues({ issueType: IssueType.PIPELINE, ...baseQuery });

  return React.useMemo(() => {
    const allResults = [buildResult, testResult, releaseResult, dependencyResult, pipelineResult];

    const isLoaded = allResults.every((result) => !result.isLoading);
    const error = allResults.find((result) => result.error)?.error;

    if (!isLoaded || error) {
      return { counts: undefined, isLoaded, error };
    }

    return {
      counts: {
        build: buildResult.data?.total ?? 0,
        test: testResult.data?.total ?? 0,
        release: releaseResult.data?.total ?? 0,
        dependency: dependencyResult.data?.total ?? 0,
        pipeline: pipelineResult.data?.total ?? 0,
      },
      isLoaded,
      error,
    };
  }, [buildResult, testResult, releaseResult, dependencyResult, pipelineResult]);
};
