import { useContext, useMemo } from 'react';
import { Bullseye, Flex, Spinner, Stack } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import PipelineRunEmptyStateV2 from '~/components/PipelineRun/PipelineRunEmptyStateV2';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { Table, useDeepCompareMemoize } from '~/shared';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunKind } from '~/types';
import { statuses } from '~/utils/commits-utils';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { textMatch } from '~/utils/text-filter-utils';
import { dependencyRunsListHeader } from './DependencyRunsListHeader';
import { DependencyRunsListRow } from './DependencyRunsListRow';

import './DependencyRunsList.scss';

const filterDependencyRuns = (
  runs: PipelineRunKind[],
  filters: { name: string; status: string[] },
): PipelineRunKind[] => {
  const { name, status } = filters;
  return runs.filter(
    (plr) =>
      (!name || textMatch(plr.metadata.name, name)) &&
      (!status.length || status.includes(pipelineRunStatus(plr))),
  );
};

type DependencyRunsListViewProps = {
  componentName: string;
};

export const DependencyRunsListView = ({ componentName }: DependencyRunsListViewProps) => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter } = filters;

  const [component, componentLoaded, componentError] = useComponent(namespace, componentName, true);
  const [
    dependencyRuns,
    dependencyRunsLoaded,
    dependencyRunsError,
    getNextPage,
    { isFetchingNextPage, hasNextPage },
  ] = usePipelineRunsV2(
    componentLoaded && !componentError ? MINTMAKER_NAMESPACE : null,
    useMemo(
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

  const sortedDependencyRuns = useMemo((): PipelineRunKind[] => {
    if (!dependencyRuns) {
      return [];
    }

    return [...dependencyRuns].sort((a, b) =>
      String(b.status?.startTime || '').localeCompare(String(a.status?.startTime || '')),
    );
  }, [dependencyRuns]);

  const statusFilterObj = useMemo(
    () => createFilterObj(sortedDependencyRuns, (run) => pipelineRunStatus(run), statuses),
    [sortedDependencyRuns],
  );

  const filteredDependencyRuns = useMemo(
    () => filterDependencyRuns(sortedDependencyRuns, filters),
    [sortedDependencyRuns, filters],
  );

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyStateV2 />;

  const error = componentError ?? dependencyRunsError;
  if (error) {
    const loaded = componentError ? componentLoaded : dependencyRunsLoaded;
    return getErrorState(error, loaded, 'dependency runs');
  }

  const isFiltered = nameFilter.length > 0 || statusFilter.length > 0;

  return (
    <Flex className="dependency-runs-list" direction={{ default: 'column' }}>
      {(isFiltered || sortedDependencyRuns.length > 0) && (
        <BaseTextFilterToolbar
          text={nameFilter}
          label="Name"
          setText={(newName) => setFilters({ ...filters, name: newName })}
          onClearFilters={onClearFilters}
        >
          <MultiSelect
            label="Status"
            filterKey="status"
            values={statusFilter}
            setValues={(newStatuses) => setFilters({ ...filters, status: newStatuses })}
            options={statusFilterObj}
          />
        </BaseTextFilterToolbar>
      )}
      <Table
        data={filteredDependencyRuns}
        unfilteredData={sortedDependencyRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        aria-label="Dependency run list"
        Header={dependencyRunsListHeader}
        Row={(props) => <DependencyRunsListRow obj={props.obj as PipelineRunKind} />}
        loaded={isFetchingNextPage || dependencyRunsLoaded}
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
        isInfiniteLoading
        infiniteLoaderProps={{
          isRowLoaded: (args) => {
            return !!filteredDependencyRuns[args.index];
          },
          loadMoreRows: () => {
            hasNextPage && !isFetchingNextPage && getNextPage?.();
          },
          rowCount: hasNextPage ? filteredDependencyRuns.length + 1 : filteredDependencyRuns.length,
        }}
      />
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
