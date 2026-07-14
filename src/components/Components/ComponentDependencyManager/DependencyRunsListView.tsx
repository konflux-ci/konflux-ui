import React from 'react';
import { Bullseye, Flex, Spinner, Stack } from '@patternfly/react-core';
import PipelineRunEmptyStateV2 from '~/components/PipelineRun/PipelineRunEmptyStateV2';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  buildOptions,
  useFilterState,
  useFilteredData,
  FilterToolbar,
} from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunKind } from '~/types';
import { statuses } from '~/utils/commits-utils';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import {
  DEPENDENCY_RUNS_COLUMN_STATE_KEY,
  dependencyRunsColumns,
  filterConfigs,
} from './dependency-runs-table-config';

type DependencyRunsListViewProps = {
  componentName: string;
};

export const DependencyRunsListView = ({ componentName }: DependencyRunsListViewProps) => {
  const namespace = useNamespace();
  const { filterValues, clientFilterValues, clearAll, isFiltered } = useFilterState(filterConfigs);

  const nameFilter = filterValues.name ?? '';

  const [component, componentLoaded, componentError] = useComponent(namespace, componentName, true);
  const [
    dependencyRuns,
    dependencyRunsLoaded,
    dependencyRunsError,
    getNextPage,
    { isFetchingNextPage, hasNextPage },
  ] = usePipelineRunsV2(
    componentLoaded && !componentError ? MINTMAKER_NAMESPACE : null,
    React.useMemo(
      () => ({
        selector: {
          filterByCreationTimestampAfter: component?.metadata?.creationTimestamp,
          filterByName: nameFilter || undefined,
          matchLabels: {
            [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: componentName,
            [PipelineRunLabel.MINTMAKER_NAMESPACE_LABEL]: namespace,
          },
        },
      }),
      [component?.metadata?.creationTimestamp, componentName, nameFilter, namespace],
    ),
  );

  const sortedDependencyRuns = React.useMemo((): PipelineRunKind[] => {
    if (!dependencyRuns) {
      return [];
    }

    return [...dependencyRuns].sort((a, b) =>
      String(b.status?.startTime || '').localeCompare(String(a.status?.startTime || '')),
    );
  }, [dependencyRuns]);

  const { filteredData } = useFilteredData(filterConfigs, sortedDependencyRuns, clientFilterValues);

  const statusOptions = React.useMemo(
    () =>
      buildOptions(sortedDependencyRuns, (run) => pipelineRunStatus(run), { validKeys: statuses }),
    [sortedDependencyRuns],
  );

  const error = componentError ?? dependencyRunsError;
  if (error) {
    const loaded = componentError ? componentLoaded : dependencyRunsLoaded;
    return getErrorState(error, loaded, 'dependency runs');
  }

  return (
    <Flex direction={{ default: 'column' }}>
      <TableContainer
        data={filteredData}
        unfilteredData={sortedDependencyRuns}
        loaded={isFetchingNextPage || dependencyRunsLoaded}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        noDataState={<PipelineRunEmptyStateV2 />}
        toolbar={
          isFiltered || sortedDependencyRuns.length > 0 ? (
            <FilterToolbar configs={filterConfigs} options={{ status: statusOptions }} />
          ) : undefined
        }
      >
        <Table
          data={filteredData}
          columns={dependencyRunsColumns}
          getRowId={(row) => row.metadata?.uid ?? row.metadata?.name ?? ''}
          aria-label="Dependency run list"
          enableSorting
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={() => {
            if (hasNextPage && !isFetchingNextPage) {
              getNextPage?.();
            }
          }}
          columnStateKey={DEPENDENCY_RUNS_COLUMN_STATE_KEY}
        />
      </TableContainer>
      {isFetchingNextPage ? (
        <Stack style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }} hasGutter>
          <Bullseye>
            <Spinner size="lg" aria-label="Loading more pipeline runs" />
          </Bullseye>
        </Stack>
      ) : null}
    </Flex>
  );
};
