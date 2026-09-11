import { Link } from 'react-router-dom';
import { Button, Truncate } from '@patternfly/react-core';
import { COMPONENT_DETAILS_PATH, COMPONENT_DETAILS_V2_PATH } from '@routes/paths';
import { useMintmakerLogViewerModal } from '~/components/LogViewer/MintmakerLogViewer';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { Timestamp } from '~/shared';
import { Duration } from '~/shared/components/duration';
import { defineFilters } from '~/shared/components/Filter';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { PipelineRunKind } from '~/types';
import { statusFilterConfig } from '~/utils/pipeline-run-filter-utils';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

export const DEPENDENCY_RUNS_COLUMN_STATE_KEY = 'dependency-runs-list';

const ViewLogsCell = ({ pipelineRun }: { pipelineRun: PipelineRunKind }) => {
  const openModal = useMintmakerLogViewerModal(pipelineRun);
  return (
    <Button
      variant="link"
      isInline
      size="sm"
      data-test={`view-logs-${pipelineRun.metadata?.name}`}
      onClick={openModal}
    >
      View logs
    </Button>
  );
};

export const getDependencyRunsFilterConfig = (isSingleComponent: boolean) =>
  defineFilters<PipelineRunKind>()([
    {
      type: 'search',
      param: 'name',
      label: 'Name',
      mode: 'api',
    },
    statusFilterConfig,
    ...(isSingleComponent
      ? []
      : ([
          {
            type: 'multiSelect',
            param: 'component',
            label: 'Component',
            mode: 'api',
          },
        ] as const)),
  ] as const);

export const getDependencyRunsTableColumns = (
  namespace: string,
  applicationName: string | undefined,
  isSingleComponent: boolean,
): ColumnDefinition<PipelineRunKind>[] => [
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
  ...(isSingleComponent
    ? []
    : [
        {
          id: 'component',
          header: 'Component',
          accessorFn: (row) => row.metadata?.labels?.[PipelineRunLabel.MINTMAKER_COMPONENT_LABEL],
          size: 2,
          nonHidable: true,
          cell: (info) => {
            const componentName = info.getValue() as string | undefined;
            const path = applicationName
              ? COMPONENT_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName,
                  componentName,
                })
              : COMPONENT_DETAILS_V2_PATH.createPath({
                  workspaceName: namespace,
                  componentName,
                });

            return (
              <span data-test="dependency-run-component">
                {componentName ? <Link to={path}>{componentName}</Link> : '-'}
              </span>
            );
          },
        },
      ]),
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
    size: 2,
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
