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
import { TASKRUN_LOGS_PATH } from '@routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { getScanResults } from '../../../../hooks/useScanResults';
import { TaskRunKind, TektonResourceLabel } from '../../../../types';
import { ScanDetailStatus } from '../../ScanDetailStatus';

import './ScanDescriptionListGroup.scss';

type Props = {
  taskRuns: TaskRunKind[];
  showLogsLink?: boolean;
  hideIfNotFound?: boolean;
  popoverAppendTo?: boolean;
  errorState?: React.ReactNode | null;
};

const ScanDescriptionListGroup: React.FC<React.PropsWithChildren<Props>> = ({
  taskRuns,
  hideIfNotFound,
  showLogsLink,
  popoverAppendTo = true,
  errorState,
}) => {
  const namespace = useNamespace();
  const [scanResults, scanTaskRuns] = taskRuns ? getScanResults(taskRuns) : [null, []];

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
          className="pf-v5-u-font-weight-normal"
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
                  className="pf-v5-u-font-weight-normal scan-description-list__tooltip-link"
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
          className="pf-v5-u-px-0"
          data-test="view-logs-popover-trigger-test-id"
        >
          View logs
        </Button>
      </Popover>
    );
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
            {scanResults?.vulnerabilities ? renderLogsLink() : null}
          </>
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default ScanDescriptionListGroup;
