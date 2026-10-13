import React from 'react';
import { capitalize, Flex } from '@patternfly/react-core';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  useFilterState,
  useFilteredData,
  FilterToolbar,
  buildOptions,
} from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { statuses } from '~/utils/commits-utils';
import {
  DEPENDENCY_RUNS_COLUMN_STATE_KEY,
  getDependencyRunsTableColumns,
  getDependencyRunsFilterConfig,
} from './dependency-runs-table-config';
import { DependencyRunsEmptyState } from './DependencyRunsEmptyState';

export type DependencyRunsListViewProps = {
  applicationName?: string;
  componentNames: string[];
  isSingleComponent: boolean;
  filterByCreationTimestampAfter?: string;
};

export const DependencyRunsListView = ({
  applicationName,
  componentNames,
  isSingleComponent,
  filterByCreationTimestampAfter,
}: DependencyRunsListViewProps) => {
  const namespace = useNamespace();
  const componentName = isSingleComponent ? componentNames[0] : undefined;
  const filterConfig = React.useMemo(
    () => getDependencyRunsFilterConfig(isSingleComponent),
    [isSingleComponent],
  );
  const columns = React.useMemo(
    () => getDependencyRunsTableColumns(namespace, applicationName, isSingleComponent),
    [namespace, applicationName, isSingleComponent],
  );
  const { filterValues, clientFilterValues, clearAll, isFiltered } = useFilterState(filterConfig);

  const nameFilter = filterValues.name ?? '';
  const selectedComponents = React.useMemo(
    () =>
      !isSingleComponent && Array.isArray(filterValues.component) ? filterValues.component : [],
    [filterValues.component, isSingleComponent],
  );

  const matchExpressions = React.useMemo(() => {
    if (isSingleComponent || selectedComponents.length === 0) {
      return [];
    }

    return [
      {
        key: PipelineRunLabel.MINTMAKER_COMPONENT_LABEL,
        operator: 'In',
        values: selectedComponents,
      },
    ];
  }, [isSingleComponent, selectedComponents]);

  const pipelineRunOptions = React.useMemo(
    () => ({
      selector: {
        filterByCreationTimestampAfter,
        filterByName: nameFilter || undefined,
        matchLabels: {
          ...(isSingleComponent && componentName
            ? { [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: componentName }
            : {}),
          ...(!isSingleComponent && applicationName
            ? { [PipelineRunLabel.MINTMAKER_APPLICATION_LABEL]: applicationName }
            : {}),
          [PipelineRunLabel.MINTMAKER_NAMESPACE_LABEL]: namespace,
        },
        matchExpressions,
      },
    }),
    [
      applicationName,
      componentName,
      filterByCreationTimestampAfter,
      isSingleComponent,
      matchExpressions,
      nameFilter,
      namespace,
    ],
  );

  const [
    dependencyRuns,
    dependencyRunsLoaded,
    dependencyRunsError,
    getNextPage,
    { isFetchingNextPage, hasNextPage },
  ] = usePipelineRunsV2(MINTMAKER_NAMESPACE, pipelineRunOptions);

  const dependencyRunsList = dependencyRuns ?? [];

  const { filteredData } = useFilteredData(filterConfig, dependencyRunsList, clientFilterValues);

  const statusOptions = React.useMemo(() => buildOptions(statuses, (s) => capitalize(s)), []);

  const componentOptions = React.useMemo(
    () => buildOptions(componentNames, (component) => component),
    [componentNames],
  );

  if (dependencyRunsError) {
    return getErrorState(dependencyRunsError, dependencyRunsLoaded, 'dependency runs');
  }

  return (
    <Flex direction={{ default: 'column' }}>
      <TableContainer
        data={filteredData}
        unfilteredData={dependencyRunsList}
        loaded={dependencyRunsLoaded}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        noDataState={<DependencyRunsEmptyState isSingleComponent={isSingleComponent} />}
        toolbar={
          isFiltered || dependencyRunsList.length > 0 ? (
            <FilterToolbar
              configs={filterConfig}
              options={{ status: statusOptions, component: componentOptions }}
            />
          ) : undefined
        }
      >
        <Table
          data={filteredData}
          columns={columns}
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
