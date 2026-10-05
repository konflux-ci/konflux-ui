import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Popover,
} from '@patternfly/react-core';
import {
  NAMESPACE_PIPELINE_RUN_VULNERABILITIES_PATH,
  PIPELINE_RUNS_VULNERABILITIES_PATH,
} from '@routes/paths';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  getPipelineRunVulnerabilitiesPath,
  getTaskRunDetailsPath,
} from '~/utils/pipeline-run-routes';
import { getScanResults } from '../../../../hooks/useScanResults';
import { PipelineRunKind, TaskRunKind, TektonResourceLabel } from '../../../../types';
import { ScanDetailStatus } from '../../ScanDetailStatus';

import './ScanDescriptionListGroup.scss';

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
      appendTo={popoverAppendTo ? () => document.querySelector('#hacDev-modal-container') : undefined}
      className="scan-description-list__popover"
      data-test="scan-description-list-popover-test-id"
      bodyContent={
        <div className="scan-description-list__tooltip">
          <div className="scan-description-list__tooltip-title">View logs</div>
          <div className="scan-description-list__tooltip-description">
            View logs for each task run individually
          </div>
          {logTasks.map((scanTaskRun) => (
            <div
              key={scanTaskRun.metadata.uid ?? scanTaskRun.metadata.name}
              className="scan-description-list__tooltip-task"
            >
              {scanTaskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask] ||
                scanTaskRun.metadata.name}
              <Link
                to={`${getTaskRunDetailsPath(scanTaskRun, namespace, pipelineRun)}/logs`}
                className="pf-v6-u-font-weight-normal scan-description-list__tooltip-link"
              >
                <span
                  data-test={`${
                    scanTaskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask] ||
                    scanTaskRun.metadata.name
                  }-link-test-id`}
                >
                  View logs
                </span>
              </Link>
            </div>
          ))}
        </div>
      }
    >
      <Button
        variant={ButtonVariant.link}
        className="pf-v6-u-px-0"
        data-test="view-logs-popover-trigger-test-id"
      >
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
  if (!showLogsLink) return null;

  const logTasks = scanTaskRuns.filter((task) =>
    getTaskRunDetailsPath(task, namespace, pipelineRun),
  );
  let vulnerabilitiesPath: string | undefined;

  if (roxctlScanTaskRun && showVulnerabilitiesLink !== false) {
    const applicationName = roxctlScanTaskRun.metadata?.labels?.[PipelineRunLabel.APPLICATION];
    const pipelineRunName = roxctlScanTaskRun.metadata?.labels?.[TektonResourceLabel.pipelinerun];

    if (pipelineRun) {
      vulnerabilitiesPath = getPipelineRunVulnerabilitiesPath(pipelineRun, namespace);
    } else if (applicationName && pipelineRunName) {
      vulnerabilitiesPath = PIPELINE_RUNS_VULNERABILITIES_PATH.createPath({
        workspaceName: namespace,
        applicationName,
        pipelineRunName,
      });
    } else if (pipelineRunName) {
      vulnerabilitiesPath = NAMESPACE_PIPELINE_RUN_VULNERABILITIES_PATH.createPath({
        workspaceName: namespace,
        pipelineRunName,
      });
    }
  }

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
