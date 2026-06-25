import * as React from 'react';
import { runStatus } from '~/consts/pipelinerun';
import { Timestamp } from '../../shared';
import { PipelineRunKind } from '../../types';
import { getBuildStatusIcon } from '../../utils/gitops-utils';
import { pipelineRunStatus } from '../../utils/pipeline-utils';

const buildStatusString = (status: runStatus) => {
  switch (status) {
    case runStatus.Succeeded:
    case runStatus.TestWarning:
    case runStatus.Skipped:
      return 'Build completed';
    case runStatus.Cancelled:
      return 'Build cancelled';
    case runStatus.Failed:
    case runStatus.FailedToStart:
    case runStatus.TestFailed:
      return 'Build failed';
    case runStatus['In Progress']:
    case runStatus.Pending:
    case runStatus.Running:
    case runStatus.Idle:
      return 'Build running';
    case runStatus.Cancelling:
      return 'Build cancelling';
    case runStatus.PipelineNotStarted:
      return 'Build not started';
    default:
      return 'Build status unknown';
  }
};

const buildTimestamp = (pipelineRun: PipelineRunKind, status: runStatus) => {
  switch (status) {
    case runStatus.Succeeded:
    case runStatus.TestWarning:
    case runStatus.Cancelled:
    case runStatus.Failed:
      return pipelineRun?.status?.completionTime;
    case runStatus.PipelineNotStarted:
      return '';
    default:
      return pipelineRun?.status?.startTime;
  }
};

type PipelineRunStatusProps = {
  pipelineRun: PipelineRunKind;
  includeTimestamp?: boolean;
};

const PipelineRunStatus: React.FC<PipelineRunStatusProps> = ({
  pipelineRun,
  includeTimestamp = true,
}) => {
  const buildStatus = pipelineRun ? pipelineRunStatus(pipelineRun) : runStatus.PipelineNotStarted;

  return (
    <div className="component-list-view__build-completion--time">
      {getBuildStatusIcon(buildStatus)}
      <div>{buildStatusString(buildStatus)}</div>
      {includeTimestamp && buildStatus !== runStatus.PipelineNotStarted ? (
        <Timestamp timestamp={buildTimestamp(pipelineRun, buildStatus)} />
      ) : null}
    </div>
  );
};

export default PipelineRunStatus;
