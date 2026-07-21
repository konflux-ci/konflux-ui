import React from 'react';
import { Flex } from '@patternfly/react-core';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useFilterState, useFilteredData, FilterToolbar } from '~/shared/components/Filter';
import { FilterOption } from '~/shared/components/Filter/types';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunKind } from '~/types';
import { statuses } from '~/utils/commits-utils';
import {
  DEPENDENCY_RUNS_COLUMN_STATE_KEY,
  dependencyRunsTableColumns,
  dependencyRunsFilterConfig,
} from './dependency-runs-table-config';
import { DependencyRunsEmptyState } from './DependencyRunsEmptyState';

type DependencyRunsListViewProps = {
  componentName: string;
};

export const DependencyRunsListView = ({ componentName }: DependencyRunsListViewProps) => {
  const namespace = useNamespace();
  const { filterValues, clientFilterValues, clearAll, isFiltered } = useFilterState(
    dependencyRunsFilterConfig,
  );

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

  const dependencyRunsList = React.useMemo(
    (): PipelineRunKind[] => dependencyRuns ?? [],
    [dependencyRuns],
  );

  const { filteredData } = useFilteredData(
    dependencyRunsFilterConfig,
    dependencyRunsList,
    clientFilterValues,
  );

  const statusOptions: FilterOption[] = React.useMemo(
    () => statuses.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s })),
    [],
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
        unfilteredData={dependencyRunsList}
        loaded={dependencyRunsLoaded}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        noDataState={<DependencyRunsEmptyState />}
        toolbar={
          isFiltered || dependencyRunsList.length > 0 ? (
            <FilterToolbar
              configs={dependencyRunsFilterConfig}
              options={{ status: statusOptions }}
            />
          ) : undefined
        }
      >
        <Table
          data={filteredData}
          columns={dependencyRunsTableColumns}
          getRowId={(row) => row.metadata?.uid ?? row.metadata?.name ?? ''}
          aria-label="Dependency run list"
          enableSorting
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={getNextPage}
          columnStateKey={DEPENDENCY_RUNS_COLUMN_STATE_KEY}
        />
      </TableContainer>
    </Flex>
  );
};
