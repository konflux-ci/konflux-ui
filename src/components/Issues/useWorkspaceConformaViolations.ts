import * as React from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  aggregateCounts,
  fetchConformaForComponent,
} from '~/components/Conforma/conforma-fetch-utils';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useAllComponents } from '~/hooks/useComponents';
import { logger } from '~/monitoring/logger';
import { useNamespace } from '~/shared/providers/Namespace';

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

const CONFORMA_STALE_TIME_MS = 5 * 60 * 1000;

export const useWorkspaceConformaViolations = (): WorkspaceConformaViolations => {
  const namespace = useNamespace();
  const isKubearchiveLogsEnabled = useIsOnFeatureFlag('kubearchive-logs');

  const [components, componentsLoaded, componentsError] = useAllComponents(namespace);

  const { conformaData, allSettled, conformaAllError, conformaPartialError } = useQueries({
    queries: (componentsLoaded ? components : []).map((comp) => ({
      queryKey: [
        'workspace-conforma',
        namespace,
        comp.spec.application,
        comp.metadata.name,
        isKubearchiveLogsEnabled,
      ] as const,
      queryFn: () =>
        fetchConformaForComponent(namespace, comp.metadata.name, isKubearchiveLogsEnabled),
      staleTime: CONFORMA_STALE_TIME_MS,
      enabled: !!namespace && !!comp.metadata.name,
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
    const loaded = componentsLoaded;
    const error = componentsError ?? conformaAllError;

    if (!loaded || !allSettled) {
      return {
        totalViolations: 0,
        totalWarnings: 0,
        applications: [],
        loaded: false,
        error,
      };
    }

    let totalViolations = 0;
    let totalWarnings = 0;

    const perApp = new Map<string, AppViolationSummary>();

    conformaData.forEach((data, idx) => {
      if (!data) return;
      const applicationName = components[idx]?.spec.application ?? '';
      if (!applicationName) return;
      const { violationCount, warningCount } = aggregateCounts(data);
      totalViolations += violationCount;
      totalWarnings += warningCount;
      const existing = perApp.get(applicationName) ?? {
        applicationName,
        violationCount: 0,
        warningCount: 0,
      };
      perApp.set(applicationName, {
        applicationName,
        violationCount: existing.violationCount + violationCount,
        warningCount: existing.warningCount + warningCount,
      });
    });

    return {
      totalViolations,
      totalWarnings,
      applications: Array.from(perApp.values()),
      loaded: true,
      error,
      partialError: conformaPartialError,
    };
  }, [
    componentsLoaded,
    componentsError,
    conformaData,
    allSettled,
    conformaAllError,
    conformaPartialError,
    components,
  ]);
};
