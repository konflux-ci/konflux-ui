import React from 'react';
import { Link } from 'react-router-dom';
import { Skeleton, Tooltip } from '@patternfly/react-core';
import { ClipboardCheckIcon } from '@patternfly/react-icons/dist/esm/icons/clipboard-check-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import capitalize from 'lodash-es/capitalize';
import { usePipelinerunActionsLazy } from '~/components/PipelineRun/PipelineRunListView/pipelinerun-actions';
import { PipelineRunTestOutputResult } from '~/components/PipelineRun/PipelineRunListView/PipelineRunTestOutputResult';
import { ScanStatus } from '~/components/PipelineRun/PipelineRunListView/ScanStatus';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import {
  PipelineRunLabel,
  PipelineRunType,
  runStatus,
  UNFINISHED_PLR_STATUSES,
} from '~/consts/pipelinerun';
import { usePipelineRunTestOutputResult } from '~/hooks/usePipelineRunTestOutputResult';
import { useKarchScanResults } from '~/hooks/useScanResults';
import { PIPELINE_RUNS_DETAILS_PATH, COMPONENT_DETAILS_PATH } from '~/routes/paths';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { Duration } from '~/shared/components/duration';
import { ColumnDefinition } from '~/shared/components/TableV2';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { TriggerColumnData } from '~/shared/components/trigger-column-data/trigger-column-data';
import { PipelineRunKind } from '~/types';
import { createCommitObjectFromPLR } from '~/utils/commits-utils';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

export enum PipelineRunEventTypeLabel {
  push = 'Push',
  pull_request = 'Pull Request',
  incoming = 'Incoming',
  'retest-all-comment' = 'Retest All Comment',
}

const PipelineRunAttestation: React.FC<{ plr: PipelineRunKind }> = ({ plr }) => {
  const hasAttestation =
    plr.metadata?.annotations?.[PipelineRunLabel.CHAINS_SIGNED_ANNOTATION] === 'true';
  const AttestationIcon = hasAttestation ? ClipboardCheckIcon : ExclamationTriangleIcon;

  return (
    <Tooltip
      content={
        hasAttestation ? 'Pipeline run is signed and attested' : 'Pipeline run is not signed'
      }
    >
      <AttestationIcon
        data-test={hasAttestation ? 'attestation-signed' : 'attestation-unsigned'}
        color={
          hasAttestation
            ? 'var(--pf-v5-global--success-color--100)'
            : 'var(--pf-v5-global--warning-color--100)'
        }
        style={{ marginRight: 'var(--pf-v5-global--spacer--sm)' }}
      />
    </Tooltip>
  );
};

const shouldShowScanResults = (plr: PipelineRunKind): boolean =>
  plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD &&
  !UNFINISHED_PLR_STATUSES.includes(pipelineRunStatus(plr)) &&
  plr.status?.completionTime !== undefined;

const VulnerabilitiesCell: React.FC<{ plr: PipelineRunKind }> = ({ plr }) => {
  const showScan = shouldShowScanResults(plr);
  const [scanResults, scanLoaded, scanError] = useKarchScanResults(
    showScan ? plr.metadata?.name ?? '' : '',
  );

  if (scanError) {
    return <>N/A</>;
  }
  if (!showScan || (scanLoaded && !scanResults)) {
    return <>-</>;
  }
  if (scanLoaded) {
    return <ScanStatus scanResults={scanResults} />;
  }
  return <Skeleton />;
};

const TestOutputCell: React.FC<{ plr: PipelineRunKind; namespace: string }> = ({
  plr,
  namespace,
}) => {
  const status = pipelineRunStatus(plr);
  const shouldFetch =
    !!namespace &&
    !UNFINISHED_PLR_STATUSES.includes(status) &&
    plr.status?.completionTime !== undefined;

  const [aggregatedTestResult, isLoading] = usePipelineRunTestOutputResult(
    shouldFetch ? namespace : null,
    plr,
  );

  if (isLoading) {
    return <Skeleton screenreaderText="Loading PipelineRun test output result" />;
  }
  return <PipelineRunTestOutputResult aggregatedTestResult={aggregatedTestResult} />;
};

const ActionCell: React.FC<{ plr: PipelineRunKind }> = ({ plr }) => {
  const [actions, onOpen] = usePipelinerunActionsLazy(plr);
  return <ActionMenu actions={actions} onOpen={onOpen} />;
};

export const getPipelineRunsColumns = (namespace: string): ColumnDefinition<PipelineRunKind>[] => [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.metadata?.name ?? '',
    pinned: 'start',
    nonHidable: true,
    sortable: true,
    size: 3,
    cell: (info) => {
      const plr = info.row.original;
      const applicationName = plr.metadata?.labels?.[PipelineRunLabel.APPLICATION] ?? '';
      const pipelineRunName = plr.metadata?.name ?? '';
      const isFinished = !UNFINISHED_PLR_STATUSES.includes(pipelineRunStatus(plr));

      return (
        <>
          <Link
            to={PIPELINE_RUNS_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              pipelineRunName,
            })}
          >
            {pipelineRunName}
          </Link>
          {isFinished && <PipelineRunAttestation plr={plr} />}
        </>
      );
    },
  },
  {
    id: 'started',
    header: 'Started',
    accessorFn: (row) => row.status?.startTime ?? '',
    sortable: true,
    cell: (info) => (
      <Timestamp
        timestamp={typeof info.getValue() === 'string' ? (info.getValue() as string) : ''}
      />
    ),
  },
  {
    id: 'vulnerabilities',
    header: 'Vulnerabilities',
    visibleFrom: 'xl',
    cell: (info) => <VulnerabilitiesCell plr={info.row.original} />,
  },
  {
    id: 'duration',
    header: 'Duration',
    accessorFn: (row) => row.status?.startTime ?? '',
    sortable: true,
    visibleFrom: 'xl',
    cell: (info) => {
      const plr = info.row.original;
      const status = pipelineRunStatus(plr);
      if (status === runStatus.Pending) {
        return <>-</>;
      }
      return (
        <Duration
          startTime={typeof plr.status?.startTime === 'string' ? plr.status.startTime : undefined}
          endTime={
            typeof plr.status?.completionTime === 'string' ? plr.status.completionTime : undefined
          }
        />
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => pipelineRunStatus(row),
    sortable: true,
    cell: (info) => <StatusIconWithText status={info.getValue() as runStatus} />,
  },
  {
    id: 'testOutput',
    header: 'Test output',
    visibleFrom: 'xl',
    cell: (info) => <TestOutputCell plr={info.row.original} namespace={namespace} />,
  },
  {
    id: 'type',
    header: 'Type',
    accessorFn: (row) => row.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] ?? '',
    sortable: true,
    visibleFrom: 'xl',
    cell: (info) => <>{capitalize(info.getValue() as string) || '-'}</>,
  },
  {
    id: 'component',
    header: 'Component',
    accessorFn: (row) => row.metadata?.labels?.[PipelineRunLabel.COMPONENT] ?? '',
    sortable: true,
    visibleFrom: 'xl',
    cell: (info) => {
      const plr = info.row.original;
      const componentName = plr.metadata?.labels?.[PipelineRunLabel.COMPONENT];
      const applicationName = plr.metadata?.labels?.[PipelineRunLabel.APPLICATION];

      if (!componentName) {
        return <>-</>;
      }
      if (!applicationName) {
        return <>{componentName}</>;
      }
      return (
        <Link
          to={COMPONENT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            componentName,
          })}
        >
          {componentName}
        </Link>
      );
    },
  },
  {
    id: 'triggerReference',
    header: 'Trigger / Reference',
    visibleFrom: 'xl',
    cell: (info) => {
      const plr = info.row.original;
      const commit = createCommitObjectFromPLR(plr);
      if (!commit) {
        return <>-</>;
      }
      const eventTypeLabel =
        PipelineRunEventTypeLabel[commit.eventType as keyof typeof PipelineRunEventTypeLabel] ??
        '-';
      return (
        <>
          {eventTypeLabel}{' '}
          <TriggerColumnData
            repoOrg={commit.repoOrg}
            repoName={commit.repoName}
            repoURL={commit.repoURL}
            prNumber={commit.pullRequestNumber}
            eventType={commit.eventType}
            commitSha={commit.sha}
            shaUrl={commit.shaURL}
          />
        </>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    pinned: 'end',
    nonHidable: true,
    width: '48px',
    cell: (info) => <ActionCell plr={info.row.original} />,
  },
];
