// mock hooks

import { useMemo } from 'react';

interface APIResponse {
  data: [];
  total: number;
  limit: number;
  offset: number;
}

const mockAPIResponses: Record<string, APIResponse> = {
  'severity=critical': { data: [], total: 2, limit: 1, offset: 0 },
  'severity=major': { data: [], total: 2, limit: 1, offset: 0 },
  'severity=minor': { data: [], total: 3, limit: 1, offset: 0 },
  'severity=info': { data: [], total: 10, limit: 1, offset: 0 },
  'issueType=build': { data: [], total: 2, limit: 1, offset: 0 },
  'issueType=test': { data: [], total: 1, limit: 1, offset: 0 },
  'issueType=release': { data: [], total: 1, limit: 1, offset: 0 },
  'issueType=dependency': { data: [], total: 4, limit: 1, offset: 0 },
  'issueType=pipeline': { data: [], total: 1, limit: 1, offset: 0 },
};

interface UseIssuesResult {
  data: APIResponse | undefined;
  isLoaded: boolean;
  error: Error | undefined;
}

const mockUseIssues = (filter: string): UseIssuesResult => {
  const isLoaded = true;
  const error = undefined;

  return {
    data: mockAPIResponses[filter],
    isLoaded,
    error,
  };
};

interface IssueCounts {
  severity: Record<string, number>;
  issueType: Record<string, number>;
}

export const useIssueCounts = (): {
  counts: IssueCounts | undefined;
  isLoaded: boolean;
  error: Error | undefined;
} => {
  const criticalResult = mockUseIssues('severity=critical');
  const majorResult = mockUseIssues('severity=major');
  const minorResult = mockUseIssues('severity=minor');
  const infoResult = mockUseIssues('severity=info');

  const buildResult = mockUseIssues('issueType=build');
  const testResult = mockUseIssues('issueType=test');
  const releaseResult = mockUseIssues('issueType=release');
  const dependencyResult = mockUseIssues('issueType=dependency');
  const pipelineResult = mockUseIssues('issueType=pipeline');

  const allResults = [
    criticalResult,
    majorResult,
    minorResult,
    infoResult,
    buildResult,
    testResult,
    releaseResult,
    dependencyResult,
    pipelineResult,
  ];

  // All must be loaded
  const isLoaded = allResults.every((result) => result.isLoaded);

  // Fail if any call fails
  const error = allResults.find((result) => result.error)?.error;

  const counts = useMemo(() => {
    if (!isLoaded || error) return undefined;

    return {
      severity: {
        critical: criticalResult.data?.total || 0,
        major: majorResult.data?.total || 0,
        minor: minorResult.data?.total || 0,
        info: infoResult.data?.total || 0,
      },
      issueType: {
        build: buildResult.data?.total || 0,
        test: testResult.data?.total || 0,
        release: releaseResult.data?.total || 0,
        dependency: dependencyResult.data?.total || 0,
        pipeline: pipelineResult.data?.total || 0,
      },
    };
  }, [
    isLoaded,
    error,
    criticalResult.data?.total,
    majorResult.data?.total,
    minorResult.data?.total,
    infoResult.data?.total,
    buildResult.data?.total,
    testResult.data?.total,
    releaseResult.data?.total,
    dependencyResult.data?.total,
    pipelineResult.data?.total,
  ]);

  return { counts, isLoaded, error };
};
