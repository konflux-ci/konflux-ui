import * as React from 'react';
import { aggregateCounts } from '~/components/Conforma/conforma-fetch-utils';
import { useComponentsConformaResults } from '~/components/Conforma/ConformaResultsTab/useComponentsConformaResults';
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

  const [components, componentsLoaded, componentsError] = useAllComponents(namespace);

  // No applicationName → watches all security TaskRuns in the namespace.
  // The shared hook aligns fill-in query keys per component.spec.application,
  // so data fetched here is reused when the user navigates to an app's
  // Conforma Results tab (no re-fetch of logs already in cache).
  const {
    conformaByComponent,
    taskRunsLoaded,
    logsSettled,
    fillInSettled,
    taskRunsError,
    aggregatedLogError,
  } = useComponentsConformaResults(namespace, componentsLoaded ? components : []);

  const allSettled = logsSettled && fillInSettled;

  React.useEffect(() => {
    if (aggregatedLogError) {
      logger.warn('Partial workspace Conforma log fetch failure', { error: aggregatedLogError });
    }
  }, [aggregatedLogError]);

  return React.useMemo((): WorkspaceConformaViolations => {
    const loaded = componentsLoaded && taskRunsLoaded;
    const error = componentsError ?? taskRunsError;

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

    components.forEach((comp) => {
      const compName = comp.metadata?.name;
      const appName = comp.spec?.application;
      if (!compName || !appName) return;

      const compData = conformaByComponent.get(compName);
      if (!compData) return;

      const { violationCount, warningCount } = aggregateCounts(compData.results);
      totalViolations += violationCount;
      totalWarnings += warningCount;

      const existing = perApp.get(appName) ?? {
        applicationName: appName,
        violationCount: 0,
        warningCount: 0,
      };
      perApp.set(appName, {
        applicationName: appName,
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
      partialError: aggregatedLogError,
    };
  }, [
    componentsLoaded,
    componentsError,
    taskRunsLoaded,
    taskRunsError,
    allSettled,
    conformaByComponent,
    components,
    aggregatedLogError,
  ]);
};
