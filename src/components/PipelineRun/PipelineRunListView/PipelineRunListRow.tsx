import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Label, Popover, Skeleton, Truncate } from '@patternfly/react-core';
import { CommitIcon } from '~/components/Commits/CommitIcon';
import { PIPELINE_RUNS_DETAILS_PATH, COMPONENT_DETAILS_PATH } from '~/routes/paths';
import { ExternalLink } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunEventType, PipelineRunLabel } from '../../../consts/pipelinerun';
import { ScanResults } from '../../../hooks/useScanResults';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { RowFunctionArgs, TableData } from '../../../shared/components/table';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { PipelineRunKind } from '../../../types';
import {
  calculateDuration,
  getPipelineRunStatusResults,
  pipelineRunStatus,
  taskTestResultStatus,
} from '../../../utils/pipeline-utils';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { usePipelinerunActions } from './pipelinerun-actions';
import { pipelineRunTableColumnClasses } from './PipelineRunListHeader';
import { ScanStatus } from './ScanStatus';

type PipelineRunListRowProps = RowFunctionArgs<
  PipelineRunKind,
  {
    vulnerabilities: { [key: string]: ScanResults };
    fetchedPipelineRuns: string[];
    error?: unknown;
  }
>;

type BasePipelineRunListRowProps = PipelineRunListRowProps & { showVulnerabilities?: boolean };

export enum PipelineRunEventTypeLabel {
  push = 'Push',
  pull_request = 'Pull Request',
  incoming = 'Incoming',
  'retest-all-comment' = 'Retest All Comment',
}

const BasePipelineRunListRow: React.FC<React.PropsWithChildren<BasePipelineRunListRowProps>> = ({
  obj,
  showVulnerabilities,
  customData,
}) => {
  const capitalize = (label: string) => {
    return label && label.charAt(0).toUpperCase() + label.slice(1);
  };
  // @ts-expect-error vulnerabilities will not be available until fetched for the next page
  const [vulnerabilities] = customData?.vulnerabilities?.[obj.metadata.name] ?? [];
  const scanLoaded = (customData?.fetchedPipelineRuns || []).includes(obj.metadata.name);
  const scanResults = scanLoaded ? vulnerabilities || {} : undefined;

  const status = pipelineRunStatus(obj);
  const actions = usePipelinerunActions(obj);
  const namespace = useNamespace();
  if (!obj.metadata?.labels) {
    obj.metadata.labels = {};
  }
  const labels = obj.metadata.labels;
  const applicationName = labels?.[PipelineRunLabel.APPLICATION];
  const gitProvider = obj.metadata.annotations?.[PipelineRunLabel.COMMIT_PROVIDER_LABEL];
  const repoOrg = labels?.[PipelineRunLabel.COMMIT_REPO_ORG_LABEL];
  const repoURL = labels?.[PipelineRunLabel.COMMIT_REPO_URL_LABEL];
  const prNumber = labels?.[PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL];
  const eventType = labels?.[PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL];
  const commitId = labels?.[PipelineRunLabel.COMMIT_LABEL];

  const getTriggerredByColumnData = useCallback(() => {
    let icon = null,
      text = ``,
      link = `https://${gitProvider}.com/${repoOrg}/${repoURL}`;
    const commitDetails = {
      text: commitId?.substring(0, 7),
      link: `${link}/commit/${commitId}`,
    };
    if (eventType === PipelineRunEventType.PUSH || eventType === PipelineRunEventType.RETEST) {
      icon = <CommitIcon isPR={false} className="sha-title-icon" />;
    } else if (eventType === PipelineRunEventType.PULL) {
      icon = <CommitIcon isPR={true} className="sha-title-icon" />;
      text = `${repoOrg}/${repoURL}/${prNumber}`;
      link = `${link}/pull/${prNumber}`;
    }
    return (
      <>
        {icon}
        {eventType === PipelineRunEventType.PULL && (
          <ExternalLink
            href={link}
            text={<Truncate content={text} style={{ marginBottom: '0.5rem' }} />}
            hideIcon={true}
          />
        )}
        {eventType ? (
          <Label color="blue">
            <ExternalLink href={commitDetails.link} text={commitDetails.text} />
          </Label>
        ) : (
          '-'
        )}
      </>
    );
  }, [commitId, eventType, gitProvider, prNumber, repoOrg, repoURL]);

  const testStatus = React.useMemo(() => {
    const results = getPipelineRunStatusResults(obj);
    return taskTestResultStatus(results);
  }, [obj]);

  return (
    <>
      <TableData className={pipelineRunTableColumnClasses.name}>
        <Link
          to={PIPELINE_RUNS_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            pipelineRunName: obj.metadata?.name,
          })}
          title={obj.metadata?.name}
        >
          {obj.metadata?.name}
        </Link>
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.started}>
        <Timestamp
          timestamp={typeof obj.status?.startTime === 'string' ? obj.status?.startTime : ''}
        />
      </TableData>
      {showVulnerabilities ? (
        <TableData
          data-test="vulnerabilities"
          className={pipelineRunTableColumnClasses.vulnerabilities}
        >
          {customData?.error ? (
            <>N/A</>
          ) : !obj?.status?.completionTime ? (
            '-'
          ) : scanLoaded ? (
            <ScanStatus scanResults={scanResults} />
          ) : (
            <Skeleton />
          )}
        </TableData>
      ) : null}
      <TableData className={pipelineRunTableColumnClasses.duration}>
        {status !== 'Pending'
          ? calculateDuration(
              typeof obj.status?.startTime === 'string' ? obj.status?.startTime : '',
              typeof obj.status?.completionTime === 'string' ? obj.status?.completionTime : '',
            )
          : '-'}
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.status}>
        <StatusIconWithText status={status} />
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.testResultStatus}>
        <Popover
          triggerAction="hover"
          aria-label="error popover"
          bodyContent={testStatus?.note}
          isVisible={testStatus?.note ? undefined : false}
        >
          <div>{testStatus?.result ? testStatus.result : '-'}</div>
        </Popover>
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.type}>
        {capitalize(obj.metadata?.labels[PipelineRunLabel.PIPELINE_TYPE])}
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.component}>
        {obj.metadata?.labels[PipelineRunLabel.COMPONENT] ? (
          obj.metadata?.labels[PipelineRunLabel.APPLICATION] ? (
            <Link
              to={COMPONENT_DETAILS_PATH.createPath({
                workspaceName: namespace,
                applicationName: obj.metadata?.labels[PipelineRunLabel.APPLICATION],
                componentName: obj.metadata?.labels[PipelineRunLabel.COMPONENT],
              })}
            >
              {obj.metadata?.labels[PipelineRunLabel.COMPONENT]}
            </Link>
          ) : (
            obj.metadata?.labels[PipelineRunLabel.COMPONENT]
          )
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.trigger}>
        {PipelineRunEventTypeLabel[eventType] ?? '-'}
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.reference}>
        {getTriggerredByColumnData()}
      </TableData>
      <TableData data-test="plr-list-row-kebab" className={pipelineRunTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export const PipelineRunListRow: React.FC<React.PropsWithChildren<PipelineRunListRowProps>> = (
  props,
) => <BasePipelineRunListRow {...props} showVulnerabilities={false} />;

export const PipelineRunListRowWithVulnerabilities: React.FC<
  React.PropsWithChildren<PipelineRunListRowProps>
> = (props) => <BasePipelineRunListRow {...props} showVulnerabilities />;
