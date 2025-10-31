import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bullseye, Spinner, Stack } from '@patternfly/react-core';
<<<<<<< HEAD
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../consts/pipeline';
=======
import {
  PipelineRunsFilterToolbar,
  useFilteredData,
  FilterConfig,
} from '~/components/Filter/generic';
>>>>>>> 1288183 (refactor: refactoring filters)
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useApplication } from '../../../hooks/useApplications';
import { usePipelineRunsV2 } from '../../../hooks/usePipelineRunsV2';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
<<<<<<< HEAD
import { Table, useDeepCompareMemoize } from '../../../shared';
=======
import { HttpError } from '../../../k8s/error';
import { Table } from '../../../shared';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
>>>>>>> 1288183 (refactor: refactoring filters)
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage';
import { useNamespace } from '../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
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

<<<<<<< HEAD
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
=======
  const filterConfigs: FilterConfig[] = React.useMemo(
    () => [
      {
        type: 'search',
        param: 'search',
        mode: 'client',
        searchAttributes: {
          attributes: [
            { key: 'name', label: 'Name' },
            { key: 'commit', label: 'Commit' },
          ],
          defaultAttribute: 'name',
          getPlaceholder: (attribute) => `Filter by ${attribute.toLowerCase()}...`,
        },
      },
      {
        type: 'multiSelect',
        param: 'status',
        label: 'Status',
        mode: 'client',
        getOptions: (data: PipelineRunKind[]) => {
          const statusMap = new Map<string, number>();
          data.forEach((plr) => {
            const status = pipelineRunStatus(plr);
            if (status) {
              statusMap.set(status, (statusMap.get(status) || 0) + 1);
            }
          });
          return Array.from(statusMap.entries()).map(([status, count]) => ({
            value: status,
            label: status,
            count,
          }));
        },
        filterFn: (item: PipelineRunKind, value: string[]) => {
          if (!Array.isArray(value) || value.length === 0) return true;
          return value.includes(pipelineRunStatus(item));
        },
      },
      {
        type: 'multiSelect',
        param: 'type',
        label: 'Type',
        mode: 'client',
        getOptions: (data: PipelineRunKind[]) => {
          const typeMap = new Map<string, number>();
          data.forEach((plr) => {
            const type = plr?.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];
            if (type) {
              typeMap.set(type, (typeMap.get(type) || 0) + 1);
            }
          });
          return Array.from(typeMap.entries()).map(([type, count]) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize for display
            count,
          }));
        },
        filterFn: (item: PipelineRunKind, value: string[]) => {
          if (!Array.isArray(value) || value.length === 0) return true;
          const runType = item?.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];
          return value.includes(runType);
        },
      },
    ],
    [],
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const name = searchParams.get('name') || '';
>>>>>>> 1288183 (refactor: refactoring filters)

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

  const baseFilteredRuns = React.useMemo(() => {
    return customFilter ? sortedPipelineRuns.filter(customFilter) : sortedPipelineRuns;
  }, [sortedPipelineRuns, customFilter]);

  const { filteredData: filteredPLRs, isFiltered: isStatusTypeFiltered } =
    useFilteredData<PipelineRunKind>(baseFilteredRuns, filterConfigs);

  const isFiltered = isStatusTypeFiltered;

  const vulnerabilities = usePLRVulnerabilities(name ? filteredPLRs : sortedPipelineRuns);

  const handleClearFilters = React.useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={handleClearFilters} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  if (error) {
    return getErrorState(error, loaded, 'pipeline runs');
  }

  return (
    <>
      {(isFiltered || sortedPipelineRuns.length > 0) && (
        <PipelineRunsFilterToolbar
<<<<<<< HEAD
          filters={filters}
          setFilters={setFilters}
          onClearFilters={onClearFilters}
          typeOptions={typeFilterObj}
          statusOptions={statusFilterObj}
          openColumnManagement={() => setIsColumnManagementOpen(true)}
          totalColumns={PIPELINE_RUN_COLUMNS_DEFINITIONS.length}
=======
          filterConfigs={filterConfigs}
          data={baseFilteredRuns}
          dataTestId="pipeline-runs-filter"
>>>>>>> 1288183 (refactor: refactoring filters)
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
