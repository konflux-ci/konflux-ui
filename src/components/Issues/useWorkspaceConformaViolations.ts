import * as React from 'react';
import { aggregateCounts } from '~/components/Conforma/conforma-fetch-utils';
import { useComponentsConformaResults } from '~/components/Conforma/ConformaResultsTab/useComponentsConformaResults';
import {
  collectPolicyExceptions,
  type PolicyException,
} from '~/components/Conforma/policy-exception-utils';
import { useAllComponents } from '~/hooks/useComponents';
import { useNamespace } from '~/shared/providers/Namespace';
import type { ComponentConformaResult } from '~/types/conforma';

export type ApplicationViolationSummary = {
  applicationName: string;
  violationCount: number;
  warningCount: number;
};

export type WorkspaceConformaViolations = {
  totalViolations: number;
  totalWarnings: number;
  applications: ApplicationViolationSummary[];
  /** Upcoming policy changes derived from warnings: expiring exceptions and pending activations. */
  exceptions: PolicyException[];
  loaded: boolean;
  settling: boolean;
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

  return React.useMemo((): WorkspaceConformaViolations => {
    const loaded = componentsLoaded && taskRunsLoaded;
    const error = componentsError ?? taskRunsError;

    if (!loaded) {
      return {
        totalViolations: 0,
        totalWarnings: 0,
        applications: [],
        exceptions: [],
        loaded: false,
        settling: false,
        error,
      };
    }

    let totalViolations = 0;
    let totalWarnings = 0;
    const perApp = new Map<string, ApplicationViolationSummary>();
    const allResults: ComponentConformaResult[] = [];

    components.forEach((comp) => {
      const compName = comp.metadata?.name;
      const appName = comp.spec?.application;
      if (!compName || !appName) return;

      const compData = conformaByComponent.get(compName);
      if (!compData) return;

      allResults.push(...compData.results);

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
      exceptions: collectPolicyExceptions(allResults),
      loaded: true,
      settling: !allSettled,
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
