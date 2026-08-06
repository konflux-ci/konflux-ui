import React from 'react';
import { ModalVariant } from '@patternfly/react-core';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import ErrorModal from '~/components/modal/ErrorModal';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import {
  Issue,
  IssueCounts,
  IssueQuery,
  IssueResponse,
  IssueSeverity,
  IssueState,
  IssueType,
} from '~/kite/issue-type';
import { logger } from '~/monitoring/logger';
import { Action } from '~/shared/components/action-menu/types';
import { PLUGIN_KITE } from './const';
import { resolveIssue } from './kite-fetch';
import { createGetIssueQueryOptions, createInfiniteIssueQueryOptions } from './kite-query';

export type IssuesBySeverity = {
  severity: IssueSeverity;
  issues: Issue[];
  total: number;
  isLoading: boolean;
  error: unknown;
};

export type IssuesWithSeverityResult = {
  data: IssuesBySeverity[];
  isLoaded: boolean;
  hasError: boolean;
};

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

export const useIssueActions = (issue: Issue): Action[] => {
  const queryClient = useQueryClient();
  const showModal = useModalLauncher();
  const isResolved = issue.state === IssueState.RESOLVED;

  return React.useMemo(
    () => [
      {
        id: `resolve-${issue.id}`,
        label: 'Resolve',
        disabled: isResolved,
        disabledTooltip: isResolved ? 'Issue is already resolved' : undefined,
        cta: () => {
          void resolveIssue(issue.id, issue.namespace)
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: [PLUGIN_KITE] });
            })
            .catch((error: unknown) => {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to resolve issue', err, { issueId: issue.id });
              showModal?.(
                createModalLauncher(ErrorModal, {
                  'data-test': 'resolve-issue-error-modal',
                  variant: ModalVariant.small,
                  title: 'Failed to resolve issue',
                })({ errorMessage: err.message }),
              );
            });
        },
      },
    ],
    [issue.id, issue.namespace, isResolved, queryClient, showModal],
  );
};
