import { Button, Truncate } from '@patternfly/react-core';
import { useMintmakerLogViewerModal } from '~/components/LogViewer/MintmakerLogViewer';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { runStatus } from '~/consts/pipelinerun';
import { Timestamp } from '~/shared';
import { Duration } from '~/shared/components/duration';
import { defineFilters } from '~/shared/components/Filter';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

const ViewLogsCell = ({ pipelineRun }: { pipelineRun: PipelineRunKind }) => {
  const openModal = useMintmakerLogViewerModal(pipelineRun);
  return (
    <span data-test="dependency-run-logs">
      <Button
        variant="link"
        size="sm"
        data-test={`view-logs-${pipelineRun.metadata?.name}`}
        onClick={openModal}
      >
        View logs
      </Button>
    </span>
  );
};

export const DEPENDENCY_RUNS_COLUMN_STATE_KEY = 'dependency-runs-list';

export const dependencyRunsFilterConfig = defineFilters<PipelineRunKind>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    mode: 'api',
  },
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    filterFn: (item, values) => values.includes(pipelineRunStatus(item)),
  },
] as const);

export const dependencyRunsTableColumns: ColumnDefinition<PipelineRunKind>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.metadata?.name ?? '',
    size: 3,
    nonHidable: true,
    cell: (info) => (
      <span data-test="dependency-run-name">
        <Truncate content={(info.getValue() as string) ?? ''} />
      </span>
    ),
  },
  {
    id: 'started',
    header: 'Started',
    accessorFn: (row) => row.status?.startTime ?? '',
    size: 2,
    sortable: true,
    cell: (info) => (
      <span data-test="dependency-run-started">
        <Timestamp timestamp={(info.getValue() as string) ?? ''} />
      </span>
    ),
  },
  {
    id: 'duration',
    header: 'Duration',
    accessorFn: (row) => row.status?.startTime ?? '',
    size: 1,
    cell: (info) => {
      const plr = info.row.original;
      const status = pipelineRunStatus(plr);
      return (
        <span data-test="dependency-run-duration">
          {status !== runStatus.Pending ? (
            <Duration startTime={plr.status?.startTime} endTime={plr.status?.completionTime} />
          ) : (
            '-'
          )}
        </span>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => pipelineRunStatus(row),
    size: 1,
    cell: (info) => (
      <span data-test="dependency-run-status">
        <StatusIconWithText status={info.getValue() as runStatus} />
      </span>
    ),
  },
  {
    id: 'logs',
    header: 'Logs',
    size: 1,
    cell: (info) => <ViewLogsCell pipelineRun={info.row.original} />,
  },
];
