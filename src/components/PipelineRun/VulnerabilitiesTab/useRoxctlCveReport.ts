import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useNamespace } from '~/shared/providers/Namespace';
import type { TaskRunKind } from '~/types';
import { resolveRoxctlCveReport } from './roxctl-fetchers';
import { toRows } from './roxctl-utils';
import type { RoxctlCveRow } from './types';

const ROXCTL_CVE_REPORT_QUERY_KEY = 'roxctl-cve-report';

/**
 * React Query hook that fetches and caches the roxctl CVE report for a TaskRun.
 *
 * Resolves the CVE report JSON from either KubeArchive or Tekton Results
 * (based on feature flag), then flattens fixable CVEs into table-ready rows.
 * Uses `staleTime: Infinity` because CVE data for a completed TaskRun
 * never changes.
 */
export const useRoxctlCveReport = (
  taskRun: TaskRunKind | undefined,
): { data: RoxctlCveRow[]; isLoading: boolean; error: unknown } => {
  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');
  const taskRunUid = taskRun?.metadata?.uid;

  const { data, isLoading, error } = useQuery({
    queryKey: [ROXCTL_CVE_REPORT_QUERY_KEY, namespace, taskRunUid, isKubearchiveLogsEnabled],
    queryFn: async () => {
      if (!taskRun) {
        return [];
      }
      const report = await resolveRoxctlCveReport(namespace, taskRun, isKubearchiveLogsEnabled);
      return toRows(report.reports, report.imagePlatforms).filter((row) => row.fixedBy);
    },
    enabled: !!taskRun && !!taskRunUid,
    staleTime: Infinity,
  });

  return React.useMemo(
    () => ({ data: data ?? [], isLoading, error }),
    [data, isLoading, error],
  );
};
