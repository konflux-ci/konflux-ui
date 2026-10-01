import { useQuery } from '@tanstack/react-query';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useNamespace } from '~/shared/providers/Namespace';
import type { TaskRunKind } from '~/types';
import { resolveRoxctlCveReport } from './roxctl-fetchers';
import { toRows } from './roxctl-utils';
import type { RoxctlCveReportResolution } from './types';

const ROXCTL_CVE_REPORT_QUERY_KEY = 'roxctl-cve-report';

const selectFixableRows = (report: RoxctlCveReportResolution) =>
  toRows(report.reports, report.imagePlatforms).filter((row) => row.fixedBy);

/**
 * React Query hook that fetches and caches the roxctl CVE report for a TaskRun.
 *
 * Resolves the CVE report JSON from either KubeArchive or Tekton Results
 * (based on feature flag), then flattens fixable CVEs into table-ready rows.
 * The query stays disabled until the TaskRun has completed because the report
 * is only available after the TaskRun logs are finalized.
 */
export const useRoxctlCveReport = (
  taskRun: TaskRunKind,
) => {
  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');
  const taskRunUid = taskRun?.metadata?.uid;
  const taskRunCompletionTime = taskRun?.status?.completionTime;

  return useQuery({
    queryKey: [
      ROXCTL_CVE_REPORT_QUERY_KEY,
      namespace,
      taskRunUid,
      isKubearchiveLogsEnabled,
    ],
    queryFn: () => resolveRoxctlCveReport(namespace, taskRun, isKubearchiveLogsEnabled),
    select: selectFixableRows,
    enabled: !!taskRunUid && !!taskRunCompletionTime,
    staleTime: Infinity,
  });
};
