import React from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  IssueCounts,
  IssueQuery,
  IssueSeverity,
  IssueType,
  IssuesWithSeverityResult,
} from '~/kite/issue-type';
import { STALE_TIME } from './const';
import { createGetIssueQueryOptions, createInfiniteIssueQueryOptions } from './kite-query';

export const useIssues = (issueQuery: IssueQuery) => {
  return useQuery(createGetIssueQueryOptions(issueQuery));
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

// Helper function to create query options for a specific severity
const createSeverityQueryOptions = (
  severity: IssueSeverity,
  baseQuery: IssueQuery,
  severities: IssueSeverity[],
  queryOptions: Record<string, unknown>,
) => {
  return createGetIssueQueryOptions(
    { severity, ...baseQuery },
    severities.includes(severity) ? queryOptions : { enabled: false },
  );
};

export const useIssuesWithSeverity = (
  namespace: string,
  severities: IssueSeverity[],
  noRefetch?: boolean,
): IssuesWithSeverityResult => {
  const baseQuery: IssueQuery = {
    namespace,
  };

  const queryOptions = noRefetch
    ? {
        staleTime: STALE_TIME,
        refetchOnMount: false as const,
      }
    : {};

  // Create queries for each severity level using the helper function
  const criticalResult = useQuery(
    createSeverityQueryOptions(IssueSeverity.CRITICAL, baseQuery, severities, queryOptions),
  );

  const majorResult = useQuery(
    createSeverityQueryOptions(IssueSeverity.MAJOR, baseQuery, severities, queryOptions),
  );

  const minorResult = useQuery(
    createSeverityQueryOptions(IssueSeverity.MINOR, baseQuery, severities, queryOptions),
  );

  const infoResult = useQuery(
    createSeverityQueryOptions(IssueSeverity.INFO, baseQuery, severities, queryOptions),
  );

  return React.useMemo(() => {
    const severityResultMap = {
      [IssueSeverity.CRITICAL]: criticalResult,
      [IssueSeverity.MAJOR]: majorResult,
      [IssueSeverity.MINOR]: minorResult,
      [IssueSeverity.INFO]: infoResult,
    };

    const data = severities.map((severity) => {
      const result = severityResultMap[severity];
      return {
        severity,
        issues: result.data?.data ?? [],
        total: result.data?.total ?? 0,
        isLoading: result.isLoading,
        error: result.error,
      };
    });

    const isLoaded = data.every((item) => !item.isLoading);
    const hasError = data.some((item) => item.error);

    return {
      data,
      isLoaded,
      hasError,
    };
  }, [severities, criticalResult, majorResult, minorResult, infoResult]);
};
