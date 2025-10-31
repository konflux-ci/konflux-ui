import * as React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Bullseye, Spinner, Stack, Title } from '@patternfly/react-core';
<<<<<<< HEAD
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { useDeepCompareMemoize } from '~/k8s/hooks/useK8sQueryWatch';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../../consts/pipeline';
=======
import {
  PipelineRunsFilterToolbar,
  useFilteredData,
  FilterConfig,
} from '~/components/Filter/generic';
>>>>>>> 1288183 (refactor: refactoring filters)
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { usePLRVulnerabilities } from '../../../../hooks/useScanResults';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import FilteredEmptyState from '../../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../../shared/components/table/ColumnManagement';
import { useLocalStorage } from '../../../../shared/hooks/useLocalStorage';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../../types';
import { pipelineRunStatus } from '../../../../utils/pipeline-utils';
import PipelineRunEmptyState from '../../../PipelineRun/PipelineRunEmptyState';
import { getPipelineRunListHeader } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';

const CommitsPipelineRunTab: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [, setSearchParams] = useSearchParams();
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
<<<<<<< HEAD
    usePipelineRunsForCommitV2(namespace, applicationName, commitName, undefined, false);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: PipelineRunsFilterState = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    commit: unparsedFilters.commit ? (unparsedFilters.commit as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
  });

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useLocalStorage<string[]>(
    `commit-pipeline-runs-columns-${applicationName}-${commitName}`,
  );

  const safeVisibleColumns = React.useMemo((): Set<PipelineRunColumnKeys> => {
    if (Array.isArray(visibleColumnKeys) && visibleColumnKeys.length > 0) {
      return new Set(visibleColumnKeys as PipelineRunColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS);
  }, [visibleColumnKeys]);

  const { name, status, type } = filters;

  const filtersForStatusOptions = React.useMemo(
    () =>
      filterPipelineRuns(pipelineRuns, {
        name: filters.name,
        commit: filters.commit,
        status: [],
        type: filters.type,
      }),
    [pipelineRuns, filters.name, filters.commit, filters.type],
=======
    usePipelineRunsForCommit(namespace, applicationName, commitName, undefined, false);

  // Define filter configurations using the new generic system
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
            const type = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
            if (type) {
              typeMap.set(type, (typeMap.get(type) || 0) + 1);
            }
          });
          return Array.from(typeMap.entries()).map(([type, count]) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
            count,
          }));
        },
        filterFn: (item: PipelineRunKind, value: string[]) => {
          if (!Array.isArray(value) || value.length === 0) return true;
          const runType = item?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
          return value.includes(runType);
        },
      },
    ],
    [],
>>>>>>> 1288183 (refactor: refactoring filters)
  );

  // Use the new generic filter system with type safety
  const { filteredData: filteredPLRs, isFiltered } = useFilteredData<PipelineRunKind>(
    pipelineRuns || [],
    filterConfigs,
  );

  const vulnerabilities = usePLRVulnerabilities(isFiltered ? filteredPLRs : pipelineRuns);

  if (error) {
    return getErrorState(error, loaded, 'pipeline runs');
  }

  if (loaded && (!pipelineRuns || pipelineRuns.length === 0)) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => setSearchParams({})} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg">
        Pipeline runs
      </Title>
      <div>
        {(isFiltered || (pipelineRuns && pipelineRuns.length > 0)) && (
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
            data={pipelineRuns || []}
            dataTestId="commits-pipeline-runs-filter"
>>>>>>> 1288183 (refactor: refactoring filters)
          />
        )}
        <Table
          key={`${pipelineRuns?.length || 0}-${vulnerabilities.fetchedPipelineRuns.length}`}
          unfilteredData={pipelineRuns || []}
          data={filteredPLRs}
          aria-label="Pipelinerun List"
          Header={getPipelineRunListHeader(safeVisibleColumns)}
          loaded={isFetchingNextPage || loaded}
          customData={vulnerabilities}
          EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
          NoDataEmptyMsg={NoDataEmptyMsg}
          Row={(props) => (
            <PipelineRunListRowWithColumns
              obj={props.obj as PipelineRunKind}
              columns={props.columns || []}
              customData={vulnerabilities}
              index={props.index}
              visibleColumns={safeVisibleColumns}
            />
          )}
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
      </div>
      <ColumnManagement<PipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={safeVisibleColumns}
        onVisibleColumnsChange={(cols) => setVisibleColumnKeys(Array.from(cols))}
        columns={PIPELINE_RUN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS}
        nonHidableColumns={NON_HIDABLE_PIPELINE_RUN_COLUMNS}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </>
  );
};

export default CommitsPipelineRunTab;
