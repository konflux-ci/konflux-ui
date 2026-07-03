import { Truncate } from '@patternfly/react-core';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { runStatus } from '~/consts/pipelinerun';
import { Timestamp } from '~/shared';
import { Duration } from '~/shared/components/duration';
import { defineFilters } from '~/shared/components/Filter';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { textMatch } from '~/utils/text-filter-utils';

export const DEPENDENCY_RUNS_COLUMN_STATE_KEY = 'dependency-runs-list';

export const filterConfigs = defineFilters<PipelineRunKind>()([
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

export const dependencyRunsColumns: ColumnDefinition<PipelineRunKind>[] = [
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
    accessorFn: (row) => row,
    size: 1,
    cell: (info) => {
      const obj = info.row.original;
      const status = pipelineRunStatus(obj);
      return (
        <span data-test="dependency-run-duration">
          {status !== runStatus.Pending ? (
            <Duration startTime={obj.status?.startTime} endTime={obj.status?.completionTime} />
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
];

export const filterDependencyRuns = (
  runs: PipelineRunKind[],
  nameFilter: string,
): PipelineRunKind[] => {
  if (!nameFilter) {
    return runs;
  }

  return runs.filter((plr) => textMatch(plr.metadata?.name, nameFilter));
};
