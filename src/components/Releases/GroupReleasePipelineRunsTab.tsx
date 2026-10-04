import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { GROUP_SNAPSHOT_DETAILS_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import {
  getReleasePipelineRuns,
  PipelineRunProcessing,
} from '~/components/Releases/release-pipeline-runs';
import { useRelease } from '~/hooks/useReleases';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  FilterToolbar,
  useFilteredData,
  useFilterState,
} from '~/shared/components/Filter';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { ColumnDefinition, SortDropdown, Table, TableContainer } from '~/shared/components/TableV2';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { calculateDuration } from '~/utils/pipeline-utils';
import { textMatch } from '~/utils/text-filter-utils';

const COLUMN_STATE_KEY = 'group-release-pipeline-runs';
const filters = defineFilters<PipelineRunProcessing>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (run, value) => textMatch(run.pipelineRun, value),
  },
]);
const SnapshotLink = ({ name }: { name: string }) => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();
  return name ? (
    <Link
      to={GROUP_SNAPSHOT_DETAILS_PATH.createPath({
        workspaceName: namespace,
        groupName,
        snapshotName: name,
      })}
    >
      {name}
    </Link>
  ) : (
    '-'
  );
};
const columns: ColumnDefinition<PipelineRunProcessing>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (run) => run.pipelineRun,
    nonHidable: true,
    sortable: true,
  },
  {
    id: 'started',
    header: 'Started',
    accessorFn: (run) => run.startTime,
    sortable: true,
    cell: ({ row }) => <Timestamp timestamp={row.original.startTime || undefined} />,
  },
  {
    id: 'duration',
    header: 'Duration',
    accessorFn: (run) =>
      run.startTime ? calculateDuration(run.startTime, run.completionTime) : '-',
  },
  { id: 'type', header: 'Type', accessorFn: (run) => run.type, sortable: true },
  {
    id: 'snapshot',
    header: 'Snapshot',
    accessorFn: (run) => run.snapshot,
    cell: ({ row }) => <SnapshotLink name={row.original.snapshot} />,
  },
  { id: 'namespace', header: 'Namespace', accessorFn: (run) => run.prNamespace, sortable: true },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (run) => (run.completionTime ? 'Completed' : run.startTime ? 'Running' : 'Pending'),
    sortable: true,
  },
  {
    id: 'completed',
    header: 'Completed',
    accessorFn: (run) => run.completionTime,
    sortable: true,
    cell: ({ row }) => <Timestamp timestamp={row.original.completionTime || undefined} />,
  },
];

const GroupReleasePipelineRunsTab = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release, loaded, error] = useRelease(namespace, releaseName);
  const runs = useMemo(() => (release ? getReleasePipelineRuns(release) : []), [release]);
  const { clientFilterValues, clearAll } = useFilterState(filters);
  const { filteredData } = useFilteredData(filters, runs, clientFilterValues);
  if (!loaded)
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  if (error) return getErrorState(error, loaded, 'release');
  if (!release) return getErrorState({ code: 404 }, loaded, 'release');
  return (
    <ListLayout title="Pipeline runs">
      <TableContainer
        data={filteredData}
        unfilteredData={runs}
        loaded={loaded}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        noDataState={
          <EmptyState titleText="No pipeline runs" headingLevel="h4">
            <EmptyStateBody>
              No pipeline runs have been created for this release yet.
            </EmptyStateBody>
          </EmptyState>
        }
        toolbar={
          <FilterToolbar configs={filters}>
            <SortDropdown columns={columns} columnStateKey={COLUMN_STATE_KEY} />
            <ColumnManagement
              columns={columns}
              columnStateKey={COLUMN_STATE_KEY}
              showColumnManagement
            />
          </FilterToolbar>
        }
      >
        <Table
          data={filteredData}
          columns={columns}
          getRowId={(run) => `${run.type}/${run.prNamespace}/${run.pipelineRun}`}
          aria-label="Release pipeline runs"
          columnStateKey={COLUMN_STATE_KEY}
        />
      </TableContainer>
    </ListLayout>
  );
};
export default GroupReleasePipelineRunsTab;
