import * as React from 'react';
import { Bullseye, Spinner, Stack } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
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

const getPipelineRunSortFunction = (
  columnKey: PipelineRunColumnKeys,
  direction: SortByDirection,
) => {
  const getValue = (plr: PipelineRunKind) => {
    switch (columnKey) {
      case 'name':
        return plr.metadata?.name || '';
      case 'started':
        return plr.status?.startTime || '';
      case 'duration':
        return plr.status?.completionTime && plr.status?.startTime
          ? new Date(plr.status.completionTime).getTime() - new Date(plr.status.startTime).getTime()
          : 0;
      case 'status':
        return pipelineRunStatus(plr) || '';
      case 'type':
        return plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] || '';
      case 'component':
        return plr.metadata?.labels?.[PipelineRunLabel.COMPONENT] || '';
      case 'trigger':
        return plr.metadata?.labels?.[PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL] || '';
      case 'reference':
        return (
          plr.metadata?.labels?.[PipelineRunLabel.COMMIT_REPO_URL_LABEL] ||
          plr.metadata?.annotations?.[PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION] ||
          ''
        );
      default:
        return '';
    }
  };

  return (a: PipelineRunKind, b: PipelineRunKind) => {
    const aValue = getValue(a);
    const bValue = getValue(b);

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === SortByDirection.asc ? aValue - bValue : bValue - aValue;
    }

    const comparison = String(aValue).localeCompare(String(bValue));
    return direction === SortByDirection.asc ? comparison : -comparison;
  };
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
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
  });

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [persistedColumns, setPersistedColumns] = useLocalStorage<string[]>(
    `pipeline-runs-columns-${applicationName}${componentName ? `-${componentName}` : ''}`,
  );

  const [activeSortIndex, setActiveSortIndex] = React.useState(1);
  const [activeSortDirection, setActiveSortDirection] = React.useState(SortByDirection.desc);

  const safeVisibleColumns = React.useMemo((): Set<PipelineRunColumnKeys> => {
    if (Array.isArray(persistedColumns) && persistedColumns.length > 0) {
      return new Set(persistedColumns as PipelineRunColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS);
  }, [persistedColumns]);

  React.useEffect(() => {
    const visibleColumnCount = Array.from(safeVisibleColumns).length;
    if (activeSortIndex >= visibleColumnCount && visibleColumnCount > 0) {
      setActiveSortIndex(0);
    }
  }, [safeVisibleColumns, activeSortIndex]);

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

  const sortedPipelineRuns = React.useMemo(() => {
    if (!pipelineRuns?.length) return [];

    const sortColumnKey = Array.from(safeVisibleColumns)[activeSortIndex];
    if (!sortColumnKey) return pipelineRuns;

    return [...pipelineRuns].sort(getPipelineRunSortFunction(sortColumnKey, activeSortDirection));
  }, [pipelineRuns, activeSortIndex, activeSortDirection, safeVisibleColumns]);

  const statusFilterObj = React.useMemo(
    () =>
      createFilterObj(sortedPipelineRuns, (plr) => pipelineRunStatus(plr), statuses, customFilter),
    [sortedPipelineRuns, customFilter],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        sortedPipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE],
        pipelineRunTypes,
        customFilter,
      ),
    [sortedPipelineRuns, customFilter],
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

  const isFiltered = name.length > 0 || type.length > 0 || status.length > 0;

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
        Header={getPipelineRunListHeader(
          safeVisibleColumns,
          activeSortIndex,
          activeSortDirection,
          (_, index, direction) => {
            setActiveSortIndex(index);
            setActiveSortDirection(direction);
          },
        )}
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
