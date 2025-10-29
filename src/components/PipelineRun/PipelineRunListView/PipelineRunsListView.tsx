import * as React from 'react';
import { Bullseye, Spinner, Stack } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../consts/pipeline';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useApplication } from '../../../hooks/useApplications';
import { usePipelineRunsV2 } from '../../../hooks/usePipelineRunsV2';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage';
import { useNamespace } from '../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import PipelineRunsFilterToolbar from '../../Filter/toolbars/PipelineRunsFilterToolbar';
import {
  filterPipelineRuns,
  PipelineRunsFilterState,
} from '../../Filter/utils/pipelineruns-filter-utils';
import PipelineRunEmptyState from '../PipelineRunEmptyState';
import { getPipelineRunListHeader } from './PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from './PipelineRunListRow';

type PipelineRunsListViewProps = {
  applicationName: string;
  componentName?: string;
  customFilter?: (plr: PipelineRunKind) => boolean;
};

const PipelineRunsListView: React.FC<React.PropsWithChildren<PipelineRunsListViewProps>> = ({
  applicationName,
  componentName,
  customFilter,
}) => {
  const namespace = useNamespace();
  const [application, applicationLoaded] = useApplication(namespace, applicationName);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: PipelineRunsFilterState = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    commit: unparsedFilters.commit ? (unparsedFilters.commit as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
  });

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [persistedColumns, setPersistedColumns] = useLocalStorage<string[]>(
    `pipeline-runs-columns-${applicationName}${componentName ? `-${componentName}` : ''}`,
  );

  const safeVisibleColumns = React.useMemo((): Set<PipelineRunColumnKeys> => {
    if (Array.isArray(persistedColumns) && persistedColumns.length > 0) {
      return new Set(persistedColumns as PipelineRunColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS);
  }, [persistedColumns]);

  const { name, status, type } = filters;

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsV2(
      applicationLoaded ? namespace : null,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
            filterByName: name || undefined,
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              ...(componentName && {
                [PipelineRunLabel.COMPONENT]: componentName,
              }),
            },
          },
        }),
        [applicationName, componentName, application, name],
      ),
    );

  const sortedPipelineRuns = React.useMemo((): PipelineRunKind[] => {
    if (!pipelineRuns) return [];

    // @ts-expect-error: toSorted might not be in TS yet
    if (typeof pipelineRuns.toSorted === 'function') {
      // @ts-expect-error: toSorted might not be in TS yet
      return pipelineRuns.toSorted((a, b) =>
        String(b.status?.startTime || '').localeCompare(String(a.status?.startTime || '')),
      );
    }

    return pipelineRuns.sort((a, b) =>
      String(b.status?.startTime || '').localeCompare(String(a.status?.startTime || '')),
    ) as PipelineRunKind[];
  }, [pipelineRuns]);

  // Create filtered datasets for calculating available options
  // Each excludes its own filter type but includes all others
  const filtersForStatusOptions = React.useMemo(
    () =>
      filterPipelineRuns(
        sortedPipelineRuns,
        {
          name: filters.name,
          commit: filters.commit,
          status: [], // Exclude status to show available status options
          type: filters.type,
        },
        customFilter,
      ),
    [sortedPipelineRuns, filters.name, filters.commit, filters.type, customFilter],
  );

  const filtersForTypeOptions = React.useMemo(
    () =>
      filterPipelineRuns(
        sortedPipelineRuns,
        {
          name: filters.name,
          commit: filters.commit,
          status: filters.status,
          type: [], // Exclude type to show available type options
        },
        customFilter,
      ),
    [sortedPipelineRuns, filters.name, filters.commit, filters.status, customFilter],
  );

  const statusFilterObj = React.useMemo(
    () => createFilterObj(filtersForStatusOptions, (plr) => pipelineRunStatus(plr), statuses),
    [filtersForStatusOptions],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        filtersForTypeOptions,
        (plr) => plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE],
        pipelineRunTypes,
      ),
    [filtersForTypeOptions],
  );

  const filteredPLRs = React.useMemo(
    () => filterPipelineRuns(sortedPipelineRuns, filters, customFilter, componentName),
    [sortedPipelineRuns, filters, customFilter, componentName],
  );

  const vulnerabilities = usePLRVulnerabilities(name ? filteredPLRs : sortedPipelineRuns);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  if (error) {
    return getErrorState(error, loaded, 'pipeline runs');
  }

  const isFiltered = String(name).length > 0 || type.length > 0 || status.length > 0;

  return (
    <>
      {(isFiltered || sortedPipelineRuns.length > 0) && (
        <PipelineRunsFilterToolbar
          filters={filters}
          setFilters={setFilters}
          onClearFilters={onClearFilters}
          typeOptions={typeFilterObj}
          statusOptions={statusFilterObj}
          openColumnManagement={() => setIsColumnManagementOpen(true)}
          totalColumns={PIPELINE_RUN_COLUMNS_DEFINITIONS.length}
        />
      )}
      <Table
        data={filteredPLRs}
        unfilteredData={sortedPipelineRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        aria-label="Pipeline run List"
        customData={vulnerabilities}
        Header={getPipelineRunListHeader(safeVisibleColumns)}
        Row={(props) => (
          <PipelineRunListRowWithColumns
            obj={props.obj as PipelineRunKind}
            columns={props.columns || []}
            customData={vulnerabilities}
            index={props.index}
            visibleColumns={safeVisibleColumns}
          />
        )}
        loaded={isFetchingNextPage || loaded}
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
        isInfiniteLoading
        infiniteLoaderProps={{
          isRowLoaded: (args) => {
            return !!filteredPLRs[args.index];
          },
          loadMoreRows: () => {
            hasNextPage && !isFetchingNextPage && getNextPage?.();
          },
          rowCount: hasNextPage ? filteredPLRs.length + 1 : filteredPLRs.length,
        }}
      />
      {isFetchingNextPage ? (
        <Stack style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }} hasGutter>
          <Bullseye>
            <Spinner size="lg" aria-label="Loading more pipeline runs" />
          </Bullseye>
        </Stack>
      ) : null}
      <ColumnManagement<PipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={safeVisibleColumns}
        onVisibleColumnsChange={(cols) => setPersistedColumns(Array.from(cols))}
        columns={PIPELINE_RUN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS}
        nonHidableColumns={NON_HIDABLE_PIPELINE_RUN_COLUMNS}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </>
  );
};

export default PipelineRunsListView;
