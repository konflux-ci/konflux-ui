import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useNamespace } from '~/shared/providers/Namespace';
import type { TaskRunKind } from '~/types';
import { resolveRoxctlCveReport } from './roxctl-fetchers';
import { toRows } from './roxctl-utils';
import type { RoxctlCveRow } from './types';

const ROXCTL_CVE_REPORT_QUERY_KEY = 'roxctl-cve-report';
const ROXCTL_CVE_REPORT_POLL_INTERVAL = 5000;

/**
 * React Query hook that fetches and caches the roxctl CVE report for a TaskRun.
 *
 * Resolves the CVE report JSON from either KubeArchive or Tekton Results
 * (based on feature flag), then flattens fixable CVEs into table-ready rows.
 * Completed TaskRun data never changes, but an in-progress TaskRun may not
 * have a pod or report available yet. Poll until the TaskRun completes and
 * include those status transitions in the query key so a transient fetch
 * failure can recover without a page refresh.
 */
export const useRoxctlCveReport = (
  taskRun: TaskRunKind | undefined,
): { data: RoxctlCveRow[]; isLoading: boolean; error: unknown } => {
  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');
  const taskRunUid = taskRun?.metadata?.uid;
  const taskRunPodName = taskRun?.status?.podName;
  const taskRunCompletionTime = taskRun?.status?.completionTime;
  const taskRunInProgress = !!taskRun && !taskRunCompletionTime;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      ROXCTL_CVE_REPORT_QUERY_KEY,
      namespace,
      taskRunUid,
      taskRunPodName,
      taskRunCompletionTime,
      isKubearchiveLogsEnabled,
    ],
    queryFn: async () => {
      if (!taskRun) {
        return [];
      }
      const report = await resolveRoxctlCveReport(namespace, taskRun, isKubearchiveLogsEnabled);
      return toRows(report.reports, report.imagePlatforms).filter((row) => row.fixedBy);
    },
    enabled: !!taskRun && !!taskRunUid,
    staleTime: Infinity,
    refetchInterval: taskRunInProgress ? ROXCTL_CVE_REPORT_POLL_INTERVAL : false,
  });

  return React.useMemo(() => ({ data: data ?? [], isLoading, error }), [data, isLoading, error]);
};
