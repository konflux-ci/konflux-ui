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
      staleTime: 5 * 60 * 1000,
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

    const perApp = new Map<string, { violationCount: number; warningCount: number }>();

    conformaData.forEach((data, idx) => {
      if (!data) return;
      const applicationName = components[idx]?.spec.application ?? '';
      if (!applicationName) return;
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

    return {
      totalViolations,
      totalWarnings,
      applications,
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
