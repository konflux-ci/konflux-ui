import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { GROUP_SNAPSHOT_DETAILS_PATH, NAMESPACE_PIPELINE_RUN_DETAILS_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import {
  getReleasePipelineRuns,
  PipelineRunProcessing,
} from '~/components/Releases/release-pipeline-runs';
import { useRelease } from '~/hooks/useReleases';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { ColumnDefinition, Table, TableContainer } from '~/shared/components/TableV2';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { calculateDuration } from '~/utils/pipeline-utils';

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
    cell: ({ row }) => (
      <Link
        to={NAMESPACE_PIPELINE_RUN_DETAILS_PATH.createPath({
          workspaceName: row.original.prNamespace,
          pipelineRunName: row.original.pipelineRun,
        })}
      >
        {row.original.pipelineRun}
      </Link>
    ),
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
        data={runs}
        unfilteredData={runs}
        loaded={loaded}
        noDataState={
          <EmptyState titleText="No pipeline runs" headingLevel="h4">
            <EmptyStateBody>
              No pipeline runs have been created for this release yet.
            </EmptyStateBody>
          </EmptyState>
        }
      >
        <Table
          data={runs}
          columns={columns}
          getRowId={(run) => `${run.type}/${run.prNamespace}/${run.pipelineRun}`}
          aria-label="Release pipeline runs"
        />
      </TableContainer>
    </ListLayout>
  );
};
export default GroupReleasePipelineRunsTab;
