import * as React from 'react';
import { useComponents } from '~/hooks/useComponents';
import { logger } from '~/monitoring/logger';
import { useNamespace } from '~/shared/providers/Namespace';
import type {
  ApplicationConformaResults,
  ComponentConformaStatus,
  ConformaResultRow,
} from '~/types/conforma';
import { TektonResourceLabel } from '~/types/coreTekton';
import { aggregateCounts } from '../conforma-fetch-utils';
import { mapConformaResultData } from './conforma-fetchers';
import { NO_OP_REFRESH, useComponentsConformaResults } from './useComponentsConformaResults';

const EMPTY_RESULTS: ApplicationConformaResults = {
  componentStatuses: [],
  allResults: [],
  totalComponents: 0,
  totalFailed: 0,
  loaded: false,
  settling: false,
  error: undefined,
  partialLogError: undefined,
  refresh: NO_OP_REFRESH,
};

function statusFromCounts(
  violationCount: number,
  warningCount: number,
  successCount: number,
  hasData: boolean,
): ComponentConformaStatus['status'] {
  if (!hasData) return 'unknown';
  if (violationCount > 0) return 'fail';
  if (warningCount > 0) return 'warning';
  if (successCount > 0) return 'pass';
  return 'unknown';
}

export const useApplicationConformaResults = (
  applicationName: string,
): ApplicationConformaResults => {
  const namespace = useNamespace();

  const [appComponents, componentsLoaded, componentsError] = useComponents(
    namespace,
    applicationName,
  );

  const {
    conformaByComponent,
    mergedLatestPerComponent,
    taskRunsLoaded,
    logsSettled,
    fillInSettled,
    taskRunsError,
    aggregatedLogError,
    refresh,
  } = useComponentsConformaResults(namespace, componentsLoaded ? appComponents : [], {
    applicationName,
  });

  const loaded = Boolean(namespace?.length && componentsLoaded && taskRunsLoaded);
  const settling = !fillInSettled || !logsSettled;
  const fatalError = componentsError ?? taskRunsError;

  React.useEffect(() => {
    if (aggregatedLogError) {
      logger.warn('Partial Conforma log fetch failure', { error: aggregatedLogError });
    }
  }, [aggregatedLogError]);

  return React.useMemo((): ApplicationConformaResults => {
    if (!namespace?.length) {
      return EMPTY_RESULTS;
    }

    const componentStatuses: ComponentConformaStatus[] = appComponents.map((c) => {
      const name = c.metadata?.name;
      if (!name) {
        return {
          componentName: '',
          status: 'unknown' as const,
          violationCount: 0,
          warningCount: 0,
          successCount: 0,
        };
      }

      const compData = conformaByComponent.get(name);
      const taskRun = mergedLatestPerComponent.get(name);
      const pipelineRunName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun];

      if (!compData) {
        return {
          componentName: name,
          status: 'unknown' as const,
          violationCount: 0,
          warningCount: 0,
          successCount: 0,
          pipelineRunName,
        };
      }

      const { violationCount, warningCount, successCount } = aggregateCounts(compData.results);
      const hasData = compData.results.length > 0;

      return {
        componentName: name,
        status: statusFromCounts(violationCount, warningCount, successCount, hasData),
        violationCount,
        warningCount,
        successCount,
        pipelineRunName,
      };
    });

    const allResults: ConformaResultRow[] = [];
    for (const [realComponentName, compData] of conformaByComponent.entries()) {
      const rows = mapConformaResultData(compData.results, compData.pipelineRunName);
      rows.forEach((row) => {
        // The EC/Conforma report assigns its own per-image `name` to each
        // components[] entry, which is NOT the real K8s component name.
        // Overwrite with the authoritative name so rows stay associated correctly.
        row.component = realComponentName;
      });
      allResults.push(...rows);
    }

    const totalComponents = componentStatuses.length;
    const totalFailed = componentStatuses.filter((c) => c.status === 'fail').length;

    return {
      componentStatuses,
      allResults,
      totalComponents,
      totalFailed,
      loaded,
      settling,
      error: fatalError,
      partialLogError: aggregatedLogError,
      refresh,
    };
  }, [
    aggregatedLogError,
    appComponents,
    conformaByComponent,
    fatalError,
    mergedLatestPerComponent,
    loaded,
    settling,
    namespace?.length,
    refresh,
  ]);
};
