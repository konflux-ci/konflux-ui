import React from 'react';
import { Bullseye, capitalize, Flex, Spinner } from '@patternfly/react-core';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useApplication } from '~/hooks/useApplications';
import { useComponent, useComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  useFilterState,
  useFilteredData,
  FilterToolbar,
  buildOptions,
} from '~/shared/components/Filter';
import { FilterOption } from '~/shared/components/Filter/types';
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

type DependencyRunsListViewProps = {
  applicationName: string;
  componentName?: string;
};

export const DependencyRunsListView = ({
  applicationName,
  componentName,
}: DependencyRunsListViewProps) => {
  const namespace = useNamespace();
  const isSingleComponent = !!componentName;
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
    () => (componentName || !Array.isArray(filterValues.component) ? [] : filterValues.component),
    [componentName, filterValues.component],
  );

  const [components, componentsLoaded, componentsError] = useComponents(
    namespace,
    !componentName ? applicationName : undefined,
    true,
  );
  const [component, componentLoaded, componentError] = useComponent(namespace, componentName, true);
  const [application, applicationLoaded, applicationError] = useApplication(
    namespace,
    applicationName,
  );

  const matchExpressions = React.useMemo(() => {
    if (selectedComponents.length === 0) {
      return [];
    }

    return [
      {
        key: PipelineRunLabel.MINTMAKER_COMPONENT_LABEL,
        operator: 'In',
        values: selectedComponents,
      },
    ];
  }, [selectedComponents]);

  const [
    dependencyRuns,
    dependencyRunsLoaded,
    dependencyRunsError,
    getNextPage,
    { isFetchingNextPage, hasNextPage },
  ] = usePipelineRunsV2(
    componentName
      ? componentLoaded && !componentError
        ? MINTMAKER_NAMESPACE
        : null
      : applicationLoaded && !applicationError
        ? MINTMAKER_NAMESPACE
        : null,
    React.useMemo(
      () => ({
        selector: {
          filterByCreationTimestampAfter: componentName
            ? component?.metadata?.creationTimestamp
            : application?.metadata?.creationTimestamp,
          filterByName: nameFilter || undefined,
          matchLabels: {
            ...(componentName && { [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: componentName }),
            [PipelineRunLabel.MINTMAKER_APPLICATION_LABEL]: applicationName,
            [PipelineRunLabel.MINTMAKER_NAMESPACE_LABEL]: namespace,
          },
          matchExpressions,
        },
      }),
      [
        application?.metadata?.creationTimestamp,
        component?.metadata?.creationTimestamp,
        componentName,
        matchExpressions,
        nameFilter,
        namespace,
        applicationName,
      ],
    ),
  );

  const dependencyRunsList = dependencyRuns ?? [];

  const { filteredData } = useFilteredData(filterConfig, dependencyRunsList, clientFilterValues);

  const statusOptions: FilterOption[] = React.useMemo(
    () => buildOptions(statuses, (s) => capitalize(s)),
    [],
  );

  const componentOptions = React.useMemo(
    () => buildOptions(components, (c) => c.metadata?.name ?? ''),
    [components],
  );

  const scopedComponentError = componentName ? componentError : undefined;
  const scopedComponentsError = componentName ? undefined : componentsError;
  const scopedApplicationError = componentName ? undefined : applicationError;
  const error =
    scopedComponentError ?? scopedComponentsError ?? scopedApplicationError ?? dependencyRunsError;
  if (error) {
    const loaded = scopedComponentError
      ? componentLoaded
      : scopedComponentsError
        ? componentsLoaded
        : scopedApplicationError
          ? applicationLoaded
          : dependencyRunsLoaded;
    return getErrorState(error, loaded, 'dependency runs');
  }

  if (
    (componentName && !componentLoaded) ||
    (!componentName && (!componentsLoaded || !applicationLoaded))
  ) {
    return (
      <Bullseye>
        <Spinner data-test="dependency-runs-spinner" />
      </Bullseye>
    );
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
