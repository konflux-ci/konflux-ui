import { RunStatus } from '@patternfly/react-topology';
import { runStatus } from '~/consts/pipelinerun';
import { runStatusToRunStatus } from '~/utils/pipeline-utils';
import { getStatusColor, STATUS_COLOR } from '~/utils/status-color-utils';

const topologyStatusColor: Record<RunStatus, string> = {
  [RunStatus.Failed]: STATUS_COLOR.danger,
  [RunStatus.FailedToStart]: STATUS_COLOR.danger,
  [RunStatus.Succeeded]: STATUS_COLOR.success,
  [RunStatus.Cancelled]: STATUS_COLOR.warning,
  [RunStatus.Skipped]: STATUS_COLOR.skipped,
  [RunStatus.Running]: STATUS_COLOR.neutral,
  [RunStatus.InProgress]: STATUS_COLOR.inProgress,
  [RunStatus.Pending]: STATUS_COLOR.neutral,
  [RunStatus.Idle]: STATUS_COLOR.neutral,
};

describe('getStatusColor', () => {
  it.each(Object.values(runStatus))('matches list view topology colors for %s', (status) => {
    expect(getStatusColor(status)).toBe(topologyStatusColor[runStatusToRunStatus(status)]);
  });

  it.each([
    [runStatus.Succeeded, STATUS_COLOR.success],
    [runStatus.Failed, STATUS_COLOR.danger],
    [runStatus.FailedToStart, STATUS_COLOR.danger],
    [runStatus.TestFailed, STATUS_COLOR.warning],
    [runStatus.Running, STATUS_COLOR.neutral],
    [runStatus.Pending, STATUS_COLOR.neutral],
    [runStatus['In Progress'], STATUS_COLOR.inProgress],
    [runStatus.Cancelled, STATUS_COLOR.warning],
    [runStatus.Cancelling, STATUS_COLOR.warning],
    [runStatus.TestWarning, STATUS_COLOR.warning],
    [runStatus.PipelineNotStarted, STATUS_COLOR.danger],
    [runStatus.Idle, STATUS_COLOR.neutral],
    [runStatus.Skipped, STATUS_COLOR.skipped],
    [runStatus.Unknown, STATUS_COLOR.neutral],
    [runStatus.NeedsMerge, STATUS_COLOR.neutral],
  ])('maps %s to %s', (status, expected) => {
    expect(getStatusColor(status)).toBe(expected);
  });
});
