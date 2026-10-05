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
import { PIPELINE_RUNS_VULNERABILITIES_PATH, TASKRUN_LOGS_PATH } from '@routes/paths';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { getScanResults } from '~/hooks/useScanResults';
import { useNamespace } from '~/shared/providers/Namespace';
import { TaskRunKind, TektonResourceLabel } from '~/types';
import { ScanDetailStatus } from '../../ScanDetailStatus';

import './ScanDescriptionListGroup.scss';

type Props = {
  taskRuns: TaskRunKind[];
  showLogsLink?: boolean;
  showVulnerabilitiesLink?: boolean;
  hideIfNotFound?: boolean;
  popoverAppendTo?: boolean;
  errorState?: React.ReactNode | null;
};

const ScanDescriptionListGroup: React.FC<React.PropsWithChildren<Props>> = ({
  taskRuns,
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

  const renderLogsLink = () => {
    if (!showLogsLink) {
      return null;
    }
    const applicationName = scanTaskRuns[0].metadata.labels[PipelineRunLabel.APPLICATION];
    const taskRunName = scanTaskRuns[0].metadata.name;
    if (scanTaskRuns.length === 1) {
      return (
        <Link
          to={TASKRUN_LOGS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            taskRunName,
          })}
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
        className="scan-description-list__popover"
        data-test="scan-description-list-popover-test-id"
        bodyContent={
          <div className="scan-description-list__tooltip">
            <div className="scan-description-list__tooltip-title">View logs</div>
            <div className="scan-description-list__tooltip-description">
              View logs for each task run individually
            </div>
            {scanTaskRuns.map((scanTaskRun) => (
              <div key={scanTaskRun.metadata.uid} className="scan-description-list__tooltip-task">
                {scanTaskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask] ||
                  scanTaskRun.metadata.name}
                <Link
                  to={TASKRUN_LOGS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: scanTaskRun.metadata.labels[PipelineRunLabel.APPLICATION],
                    taskRunName: scanTaskRun.metadata.name,
                  })}
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

  const renderScanLink = () => {
    if (!showLogsLink) {
      return null;
    }

    if (roxctlScanTaskRun && showVulnerabilitiesLink !== false) {
      const applicationName = roxctlScanTaskRun.metadata?.labels?.[PipelineRunLabel.APPLICATION];
      const pipelineRunName = roxctlScanTaskRun.metadata?.labels?.[TektonResourceLabel.pipelinerun];

      if (applicationName && pipelineRunName) {
        return (
          <Link
            to={PIPELINE_RUNS_VULNERABILITIES_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              pipelineRunName,
            })}
            className="pf-v6-u-font-weight-normal"
          >
            View vulnerabilities
          </Link>
        );
      }
    }

    return renderLogsLink();
  };

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Fixable vulnerabilities scan</DescriptionListTerm>
      <DescriptionListDescription>
        {errorState ? (
          errorState
        ) : (
          <>
            {scanResults?.vulnerabilities ? <ScanDetailStatus scanResults={scanResults} /> : '-'}
            {scanResults?.vulnerabilities ? renderScanLink() : null}
          </>
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default ScanDescriptionListGroup;
