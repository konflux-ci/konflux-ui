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
import { useNamespace } from '~/shared/providers/Namespace';
import { getTaskRunDetailsPath } from '~/utils/pipeline-run-routes';
import { getScanResults } from '../../../../hooks/useScanResults';
import { PipelineRunKind, TaskRunKind, TektonResourceLabel } from '../../../../types';
import { ScanDetailStatus } from '../../ScanDetailStatus';

import './ScanDescriptionListGroup.scss';

type Props = {
  taskRuns: TaskRunKind[];
  pipelineRun?: PipelineRunKind;
  showLogsLink?: boolean;
  hideIfNotFound?: boolean;
  popoverAppendTo?: boolean;
  errorState?: React.ReactNode | null;
};

const ScanDescriptionListGroup: React.FC<React.PropsWithChildren<Props>> = ({
  taskRuns,
  pipelineRun,
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
    const logTasks = scanTaskRuns.filter((task) =>
      getTaskRunDetailsPath(task, namespace, pipelineRun),
    );
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
