import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Popover,
} from '@patternfly/react-core';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  getTaskRunDetailsPath,
  getVulnerabilitiesPath,
} from '~/utils/pipeline-run-routes';
import { getScanResults } from '../../../../hooks/useScanResults';
import { PipelineRunKind, TaskRunKind, TektonResourceLabel } from '../../../../types';
import { ScanDetailStatus } from '../../ScanDetailStatus';

type Props = {
  taskRuns: TaskRunKind[];
  pipelineRun?: PipelineRunKind;
  showLogsLink?: boolean;
  showVulnerabilitiesLink?: boolean;
  hideIfNotFound?: boolean;
  popoverAppendTo?: boolean;
  errorState?: React.ReactNode | null;
};

type LogsLinkProps = {
  logTasks: TaskRunKind[];
  namespace: string;
  pipelineRun?: PipelineRunKind;
  popoverAppendTo: boolean;
};

const LogsLink: React.FC<LogsLinkProps> = ({
  logTasks,
  namespace,
  pipelineRun,
  popoverAppendTo,
}) => {
  if (!logTasks.length) return null;
  if (logTasks.length === 1) {
    return (
      <Link
        to={`${getTaskRunDetailsPath(logTasks[0], namespace, pipelineRun)}/logs`}
        className="pf-v6-u-font-weight-normal"
      >
        View logs
      </Link>
    );
  }

  return (
    <Popover
      appendTo={
        popoverAppendTo ? () => document.querySelector('#hacDev-modal-container') : undefined
      }
      data-test="scan-description-list-popover-test-id"
      headerContent="View logs"
      bodyContent={
        <>
          <Content component="p">View logs for each task run individually</Content>
          <DescriptionList isCompact isHorizontal>
            {logTasks.map((scanTaskRun) => (
              <DescriptionListGroup key={scanTaskRun.metadata.uid ?? scanTaskRun.metadata.name}>
                <DescriptionListTerm>
                  {scanTaskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask] ||
                    scanTaskRun.metadata.name}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Link
                    to={`${getTaskRunDetailsPath(scanTaskRun, namespace, pipelineRun)}/logs`}
                    className="pf-v6-u-font-weight-normal"
                    data-test={`${
                      scanTaskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask] ||
                      scanTaskRun.metadata.name
                    }-link-test-id`}
                  >
                    View logs
                  </Link>
                </DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        </>
      }
    >
      <Button variant={ButtonVariant.link} isInline data-test="view-logs-popover-trigger-test-id">
        View logs
      </Button>
    </Popover>
  );
};

type ScanLinkProps = {
  namespace: string;
  scanTaskRuns: TaskRunKind[];
  roxctlScanTaskRun?: TaskRunKind;
  pipelineRun?: PipelineRunKind;
  showLogsLink?: boolean;
  showVulnerabilitiesLink?: boolean;
  popoverAppendTo: boolean;
};

const ScanLink: React.FC<ScanLinkProps> = ({
  namespace,
  scanTaskRuns,
  roxctlScanTaskRun,
  pipelineRun,
  showLogsLink,
  showVulnerabilitiesLink,
  popoverAppendTo,
}) => {
  const vulnerabilitiesPath = React.useMemo(
    () =>
      getVulnerabilitiesPath(
        roxctlScanTaskRun,
        pipelineRun,
        namespace,
        showVulnerabilitiesLink !== false,
      ),
    [roxctlScanTaskRun, pipelineRun, namespace, showVulnerabilitiesLink],
  );

  if (!showLogsLink) return null;

  const logTasks = scanTaskRuns.filter((task) =>
    getTaskRunDetailsPath(task, namespace, pipelineRun),
  );

  return vulnerabilitiesPath ? (
    <Link to={vulnerabilitiesPath} className="pf-v6-u-font-weight-normal">
      View vulnerabilities
    </Link>
  ) : (
    <LogsLink
      logTasks={logTasks}
      namespace={namespace}
      pipelineRun={pipelineRun}
      popoverAppendTo={popoverAppendTo}
    />
  );
};

const ScanDescriptionListGroup: React.FC<React.PropsWithChildren<Props>> = ({
  taskRuns,
  pipelineRun,
  hideIfNotFound,
  showLogsLink,
  showVulnerabilitiesLink,
  popoverAppendTo = true,
  errorState,
}) => {
  const namespace = useNamespace();
  const [scanResults, scanTaskRuns] = taskRuns ? getScanResults(taskRuns) : [null, []];
  const roxctlScanTaskRun = taskRuns?.find(
    (taskRun) => taskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] === ROXCTL_SCAN_TASK,
  );

  if (!scanTaskRuns?.length && hideIfNotFound) {
    return null;
  }

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Fixable vulnerabilities scan</DescriptionListTerm>
      <DescriptionListDescription>
        {errorState ? (
          errorState
        ) : (
          <>
            {scanResults?.vulnerabilities ? <ScanDetailStatus scanResults={scanResults} /> : '-'}
            {scanResults?.vulnerabilities ? (
              <ScanLink
                namespace={namespace}
                scanTaskRuns={scanTaskRuns}
                roxctlScanTaskRun={roxctlScanTaskRun}
                pipelineRun={pipelineRun}
                showLogsLink={showLogsLink}
                showVulnerabilitiesLink={showVulnerabilitiesLink}
                popoverAppendTo={popoverAppendTo}
              />
            ) : null}
          </>
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default ScanDescriptionListGroup;
