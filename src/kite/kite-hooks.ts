import React from 'react';
import { useInfiniteQuery, UseQueryOptions, useQuery } from '@tanstack/react-query';
import {
  IssueCounts,
  IssueQuery,
  IssueResponse,
  IssueSeverity,
  IssueState,
  IssueType,
  IssuesWithSeverityResult,
} from '~/kite/issue-type';
import { createGetIssueQueryOptions, createInfiniteIssueQueryOptions } from './kite-query';

export const useIssues = (
  issueQuery: IssueQuery,
  options?: Partial<Omit<UseQueryOptions<IssueResponse>, 'queryKey' | 'queryFn'>>,
) => {
  return useQuery(createGetIssueQueryOptions(issueQuery, options));
};

export const useInfiniteIssues = (issueQuery: IssueQuery) => {
  return useInfiniteQuery(createInfiniteIssueQueryOptions(issueQuery));
};

export const useIssueCountsBySeverity = (namespace: string): IssueCounts => {
  const baseQuery: IssueQuery = {
    namespace,
    limit: 1,
  };

  const criticalResult = useIssues({ severity: IssueSeverity.CRITICAL, ...baseQuery });
  const majorResult = useIssues({ severity: IssueSeverity.MAJOR, ...baseQuery });
  const minorResult = useIssues({ severity: IssueSeverity.MINOR, ...baseQuery });
  const infoResult = useIssues({ severity: IssueSeverity.INFO, ...baseQuery });

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

// Hook to fetch only active critical and major issues
export const useCriticalAndMajorIssues = (
  namespace: string,
  noRefetch?: boolean,
): IssuesWithSeverityResult => {
  const baseQuery: IssueQuery = {
    namespace,
    state: IssueState.ACTIVE,
    limit: 1,
  };

  const queryOptions: Partial<Omit<UseQueryOptions<IssueResponse>, 'queryKey' | 'queryFn'>> =
    noRefetch
      ? {
          refetchOnMount: false,
        }
      : {};

  // Create queries for critical and major severity levels
  const criticalResult = useIssues(
    { severity: IssueSeverity.CRITICAL, ...baseQuery },
    queryOptions,
  );

  const majorResult = useIssues({ severity: IssueSeverity.MAJOR, ...baseQuery }, queryOptions);

  return React.useMemo(() => {
    const data = [
      {
        severity: IssueSeverity.CRITICAL,
        issues: criticalResult.data?.data ?? [],
        total: criticalResult.data?.total ?? 0,
        isLoading: criticalResult.isLoading,
        error: criticalResult.error,
      },
      {
        severity: IssueSeverity.MAJOR,
        issues: majorResult.data?.data ?? [],
        total: majorResult.data?.total ?? 0,
        isLoading: majorResult.isLoading,
        error: majorResult.error,
      },
    ];

    const isLoaded = data.every((item) => !item.isLoading);
    const hasError = data.some((item) => item.error);

    return {
      data,
      isLoaded,
      hasError,
    };
  }, [criticalResult, majorResult]);
};
