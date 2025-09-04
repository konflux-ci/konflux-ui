import * as React from 'react';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import {
  PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_SNAPSHOT_CONTEXT,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../consts/pipeline';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import PipelineRunsFilterToolbar from '../../Filter/toolbars/PipelineRunsFilterToolbar';
import {
  filterPipelineRuns,
  PipelineRunsFilterState,
} from '../../Filter/utils/pipelineruns-filter-utils';
import PipelineRunEmptyState from '../../PipelineRun/PipelineRunEmptyState';
import { getPipelineRunListHeader } from '../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from '../../PipelineRun/PipelineRunListView/PipelineRunListRow';

type SnapshotPipelineRunListProps = {
  snapshotPipelineRuns: PipelineRunKind[];
  applicationName: string;
  loaded: boolean;
  getNextPage;
  customFilter?: (plr: PipelineRunKind) => boolean;
  nextPageProps;
};
const SnapshotPipelineRunsList: React.FC<React.PropsWithChildren<SnapshotPipelineRunListProps>> = ({
  snapshotPipelineRuns,
  applicationName,
  loaded,
  getNextPage,
  nextPageProps,
  customFilter,
}) => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: PipelineRunsFilterState = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
  });
  const { name, status, type } = filters;

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useLocalStorage<string[]>(
    `snapshot-pipeline-runs-columns-${applicationName}`,
  );

  const safeVisibleColumns = React.useMemo((): Set<PipelineRunColumnKeys> => {
    if (Array.isArray(visibleColumnKeys) && visibleColumnKeys.length > 0) {
      return new Set(visibleColumnKeys as PipelineRunColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_SNAPSHOT_CONTEXT);
  }, [visibleColumnKeys]);

  const statusFilterObj = React.useMemo(
    () =>
      createFilterObj(
        snapshotPipelineRuns,
        (plr) => pipelineRunStatus(plr),
        statuses,
        customFilter,
      ),
    [snapshotPipelineRuns, customFilter],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        snapshotPipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.COMMIT_TYPE_LABEL],
        pipelineRunTypes,
        customFilter,
      ),
    [snapshotPipelineRuns, customFilter],
  );

  const filteredPLRs: PipelineRunKind[] = React.useMemo(
    () => filterPipelineRuns(snapshotPipelineRuns, filters, customFilter),
    [snapshotPipelineRuns, filters, customFilter],
  );

  const vulnerabilities = usePLRVulnerabilities(name ? filteredPLRs : snapshotPipelineRuns);

  if (!loaded) {
    return (
      <Bullseye data-test="snapshot-plr-loading">
        <Spinner />
      </Bullseye>
    );
  }

  if (!name && snapshotPipelineRuns.length === 0) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  if (!snapshotPipelineRuns || snapshotPipelineRuns.length === 0) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;
  const isFiltered = name.length > 0 || type.length > 0 || status.length > 0;

  return (
    <>
      <Title
        headingLevel="h4"
        className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg"
        data-test="snapshot-plr-title"
      >
        Pipeline runs
      </Title>
      {(isFiltered || snapshotPipelineRuns.length > 0) && (
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
        key={`${snapshotPipelineRuns.length}-${vulnerabilities.fetchedPipelineRuns.length}`}
        data={filteredPLRs}
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
        unfilteredData={snapshotPipelineRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        loaded
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
        isInfiniteLoading
        infiniteLoaderProps={{
          isRowLoaded: (args) => {
            return !!filteredPLRs[args.index];
          },
          loadMoreRows: () => {
            nextPageProps.hasNextPage && !nextPageProps.isFetchingNextPage && getNextPage?.();
          },
          rowCount: nextPageProps.hasNextPage ? filteredPLRs.length + 1 : filteredPLRs.length,
        }}
      />
      <ColumnManagement<PipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={safeVisibleColumns}
        onVisibleColumnsChange={(cols) => setVisibleColumnKeys(Array.from(cols))}
        columns={PIPELINE_RUN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_SNAPSHOT_CONTEXT}
        nonHidableColumns={NON_HIDABLE_PIPELINE_RUN_COLUMNS}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </>
  );
};

export default SnapshotPipelineRunsList;
