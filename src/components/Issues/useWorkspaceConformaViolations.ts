import * as React from 'react';
import {
  aggregateCounts,
  fetchConformaForPipeline,
  securityTaskForPipeline,
  SecurityTaskName,
} from '~/components/Conforma/conforma-fetch-utils';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { isDeveloperMockMode, MOCK_WORKSPACE_CONFORMA_VIOLATIONS } from '~/dev-mock';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useApplications } from '~/hooks/useApplications';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { logger } from '~/monitoring/logger';
import { useDeepCompareMemoize } from '~/shared/hooks/useDeepCompareMemoize';
import { useNamespace } from '~/shared/providers/Namespace';
import type { PipelineRunKind } from '~/types';

export type AppViolationSummary = {
  applicationName: string;
  violationCount: number;
  warningCount: number;
};

export type WorkspaceConformaViolations = {
  applications: AppViolationSummary[];
  totalViolations: number;
  totalWarnings: number;
  loaded: boolean;
  error: unknown;
};

type QualifyingRun = {
  applicationName: string;
  componentName: string;
  pipelineRunName: string;
  securityTaskName: SecurityTaskName;
};

function findQualifyingRuns(testRuns: PipelineRunKind[], appNames: Set<string>): QualifyingRun[] {
  const newestByAppComp = new Map<string, { pr: PipelineRunKind; app: string; comp: string }>();

  for (const pr of testRuns) {
    const app = pr.metadata?.labels?.[PipelineRunLabel.APPLICATION];
    const comp = pr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
    const prName = pr.metadata?.name;
    if (!app || !comp || !prName || !appNames.has(app)) continue;

    const key = `${app}/${comp}`;
    const candidateTs = pr.metadata?.creationTimestamp ?? '';
    const existing = newestByAppComp.get(key);
    const existingTs = existing?.pr.metadata?.creationTimestamp ?? '';

    if (
      !existing ||
      candidateTs.localeCompare(existingTs) > 0 ||
      (candidateTs === existingTs && prName.localeCompare(existing.pr.metadata?.name ?? '') > 0)
    ) {
      newestByAppComp.set(key, { pr, app, comp });
    }
  }

  const qualifiers: QualifyingRun[] = [];
  for (const { pr, app, comp } of newestByAppComp.values()) {
    const securityTaskName = securityTaskForPipeline(pr);
    if (securityTaskName && pr.metadata?.name) {
      qualifiers.push({
        applicationName: app,
        componentName: comp,
        pipelineRunName: pr.metadata.name,
        securityTaskName,
      });
    }
  }
  return qualifiers;
}

export const useWorkspaceConformaViolations = (): WorkspaceConformaViolations => {
  const useMock = isDeveloperMockMode();

  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');

  const [applications, appsLoaded, appsError] = useApplications(namespace);

  const [testRuns, pipelinesLoaded, pipelinesError] = usePipelineRunsV2(
    namespace?.length ? namespace : null,
    {
      selector: {
        matchLabels: {
          [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
        },
      },
    },
  );

  const appNames = React.useMemo(
    () =>
      new Set(
        (applications ?? [])
          .map((a) => a.metadata?.name)
          .filter((n): n is string => Boolean(n)),
      ),
    [applications],
  );

  const qualifyingRuns = React.useMemo(
    () => findQualifyingRuns(testRuns ?? [], appNames),
    [testRuns, appNames],
  );

  const stableQualifiers = useDeepCompareMemoize(
    qualifyingRuns.map((q) => ({
      applicationName: q.applicationName,
      componentName: q.componentName,
      pipelineRunName: q.pipelineRunName,
      securityTaskName: q.securityTaskName,
    })),
  );

  const [countsByApp, setCountsByApp] = React.useState<
    Record<string, { violationCount: number; warningCount: number }>
  >({});
  const [fetchFinished, setFetchFinished] = React.useState(false);

  const readyToFetch = Boolean(namespace?.length && appsLoaded && pipelinesLoaded);
  const qualifierCount = stableQualifiers?.length ?? 0;

  React.useEffect(() => {
    if (useMock) return;
    if (!readyToFetch) return;

    if (qualifierCount === 0) {
      setCountsByApp((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      setFetchFinished(true);
      return;
    }

    let aborted = false;
    setFetchFinished(false);

    const run = async () => {
      const counts: Record<string, { violationCount: number; warningCount: number }> = {};

      await Promise.all(
        (stableQualifiers ?? []).map(async (sq) => {
          try {
            const components = await fetchConformaForPipeline(
              namespace,
              sq.pipelineRunName,
              sq.securityTaskName,
              isKubearchiveLogsEnabled,
            );
            if (aborted) return;
            const { violationCount, warningCount } = aggregateCounts(components);

            const existing = counts[sq.applicationName];
            counts[sq.applicationName] = {
              violationCount: (existing?.violationCount ?? 0) + violationCount,
              warningCount: (existing?.warningCount ?? 0) + warningCount,
            };
          } catch (e) {
            if (!aborted) {
              logger.warn('Workspace conforma: fetch failed for pipeline run', {
                pipelineRunName: sq.pipelineRunName,
                error: e,
              });
            }
          }
        }),
      );

      if (!aborted) {
        setCountsByApp(counts);
        setFetchFinished(true);
      }
    };

    void run();
    return () => {
      aborted = true;
    };
  }, [useMock, readyToFetch, stableQualifiers, qualifierCount, namespace, isKubearchiveLogsEnabled]);

  const loaded = Boolean(namespace?.length && appsLoaded && pipelinesLoaded && fetchFinished);
  const error = appsError ?? pipelinesError ?? undefined;

  return React.useMemo((): WorkspaceConformaViolations => {
    if (useMock) return MOCK_WORKSPACE_CONFORMA_VIOLATIONS;

    const apps: AppViolationSummary[] = Object.entries(countsByApp)
      .filter(([, c]) => c.violationCount > 0 || c.warningCount > 0)
      .map(([applicationName, c]) => ({
        applicationName,
        violationCount: c.violationCount,
        warningCount: c.warningCount,
      }))
      .sort((a, b) => b.violationCount - a.violationCount);

    const totalViolations = apps.reduce((sum, a) => sum + a.violationCount, 0);
    const totalWarnings = apps.reduce((sum, a) => sum + a.warningCount, 0);

    return { applications: apps, totalViolations, totalWarnings, loaded, error };
  }, [useMock, countsByApp, loaded, error]);
};
