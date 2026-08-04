import * as React from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  aggregateCounts,
  fetchConformaForPipeline,
  securityTaskForPipeline,
} from '~/components/Conforma/conforma-fetch-utils';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useApplications } from '~/hooks/useApplications';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { logger } from '~/monitoring/logger';
import { useNamespace } from '~/shared/providers/Namespace';
import type { PipelineRunKind } from '~/types';

export type AppViolationSummary = {
  applicationName: string;
  violationCount: number;
  warningCount: number;
};

export type WorkspaceConformaViolations = {
  totalViolations: number;
  totalWarnings: number;
  applications: AppViolationSummary[];
  loaded: boolean;
  error?: unknown;
  partialError?: unknown;
};

const SELECTOR_TEST_RUNS = {
  matchLabels: {
    [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
  },
};

type PipelineTarget = {
  applicationName: string;
  componentName: string;
  pipelineRunName: string;
  securityTask: ReturnType<typeof securityTaskForPipeline>;
};

function pickLatestPerComponent(
  pipelineRuns: PipelineRunKind[],
): PipelineTarget[] {
  const latestByKey = new Map<string, { pr: PipelineRunKind; ts: string }>();

  for (const pr of pipelineRuns) {
    const appName = pr.metadata?.labels?.[PipelineRunLabel.APPLICATION];
    const compName = pr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
    const prName = pr.metadata?.name;
    if (!appName || !compName || !prName) continue;

    const securityTask = securityTaskForPipeline(pr);
    if (!securityTask) continue;

    const key = `${appName}/${compName}`;
    const ts = pr.metadata?.creationTimestamp ?? '';
    const existing = latestByKey.get(key);
    if (!existing || ts > existing.ts) {
      latestByKey.set(key, { pr, ts });
    }
  }

  return Array.from(latestByKey.entries()).map(([, { pr }]) => ({
    applicationName: pr.metadata?.labels?.[PipelineRunLabel.APPLICATION] ?? '',
    componentName: pr.metadata?.labels?.[PipelineRunLabel.COMPONENT] ?? '',
    pipelineRunName: pr.metadata?.name ?? '',
    securityTask: securityTaskForPipeline(pr),
  }));
}

export const useWorkspaceConformaViolations = (): WorkspaceConformaViolations => {
  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');

  const [, appsLoaded, appsError] = useApplications(namespace);

  const [pipelineRuns, prsLoaded, prsError] = usePipelineRunsV2(namespace, {
    selector: SELECTOR_TEST_RUNS,
  });

  const targets = React.useMemo(
    () => (prsLoaded ? pickLatestPerComponent(pipelineRuns) : []),
    [pipelineRuns, prsLoaded],
  );

  const { conformaData, allSettled, conformaAllError, conformaPartialError } = useQueries({
    queries: targets.map((t) => ({
      queryKey: [
        'workspace-conforma',
        namespace,
        t.applicationName,
        t.componentName,
        t.pipelineRunName,
        isKubearchiveLogsEnabled,
      ] as const,
      queryFn: () =>
        t.securityTask
          ? fetchConformaForPipeline(namespace, t.pipelineRunName, t.securityTask, isKubearchiveLogsEnabled)
          : Promise.resolve([] as Awaited<ReturnType<typeof fetchConformaForPipeline>>),
      staleTime: 5 * 60 * 1000,
      enabled: !!namespace && !!t.securityTask,
    })),
    combine: (queryResults) => {
      const errorQueries = queryResults.filter((q) => q.isError);
      const allFailed = queryResults.length > 0 && errorQueries.length === queryResults.length;
      const someFailed = errorQueries.length > 0 && !allFailed;
      return {
        conformaData: queryResults.map((q) => q.data),
        allSettled: queryResults.every((q) => !q.isLoading),
        conformaAllError: allFailed ? errorQueries[0]?.error : undefined,
        conformaPartialError: someFailed ? errorQueries[0]?.error : undefined,
      };
    },
  });

  React.useEffect(() => {
    if (conformaPartialError) {
      logger.warn('Partial workspace Conforma log fetch failure', { error: conformaPartialError });
    }
  }, [conformaPartialError]);

  return React.useMemo((): WorkspaceConformaViolations => {
    const loaded = appsLoaded && prsLoaded;
    const error = appsError ?? prsError ?? conformaAllError;

    if (!loaded || !allSettled) {
      return {
        totalViolations: 0,
        totalWarnings: 0,
        applications: [],
        loaded: false,
        error,
      };
    }

    const perApp = new Map<string, { violationCount: number; warningCount: number }>();

    conformaData.forEach((data, idx) => {
      if (!data) return;
      const { applicationName } = targets[idx];
      const { violationCount, warningCount } = aggregateCounts(data);
      const existing = perApp.get(applicationName) ?? { violationCount: 0, warningCount: 0 };
      perApp.set(applicationName, {
        violationCount: existing.violationCount + violationCount,
        warningCount: existing.warningCount + warningCount,
      });
    });

    const applications: AppViolationSummary[] = Array.from(perApp.entries()).map(
      ([applicationName, counts]) => ({
        applicationName,
        ...counts,
      }),
    );

    const totalViolations = applications.reduce((s, a) => s + a.violationCount, 0);
    const totalWarnings = applications.reduce((s, a) => s + a.warningCount, 0);

    return { totalViolations, totalWarnings, applications, loaded: true, error, partialError: conformaPartialError };
  }, [appsLoaded, appsError, prsLoaded, prsError, conformaData, allSettled, conformaAllError, conformaPartialError, targets]);
};
