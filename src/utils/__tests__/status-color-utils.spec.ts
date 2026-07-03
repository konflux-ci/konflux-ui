import { runStatus } from '~/consts/pipelinerun';
import { runStatusToRunStatus } from '~/utils/pipeline-utils';
import {
  getLabelColorFromStatus,
  getStatusColor,
  RUN_STATUS_VISUAL_CONFIG,
  STATUS_COLOR,
} from '~/utils/status-color-utils';

describe('getStatusColor', () => {
  it.each(Object.values(runStatus))('matches list view topology colors for %s', (status) => {
    const { canvas } = RUN_STATUS_VISUAL_CONFIG[runStatusToRunStatus(status)];
    expect(getStatusColor(status)).toBe(STATUS_COLOR[canvas]);
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

describe('getLabelColorFromStatus', () => {
  it('returns null for statuses without label tint', () => {
    expect(getLabelColorFromStatus(runStatus.Idle)).toBeNull();
    expect(getLabelColorFromStatus(runStatus.Pending)).toBeNull();
    expect(getLabelColorFromStatus(runStatus.Skipped)).toBeNull();
    expect(getLabelColorFromStatus(runStatus.PipelineNotStarted)).toBeNull();
    expect(getLabelColorFromStatus(runStatus.TestFailed)).toBeNull();
    expect(getLabelColorFromStatus(runStatus.TestWarning)).toBeNull();
  });

  it('returns green for success', () => {
    expect(getLabelColorFromStatus(runStatus.Succeeded)).toBe('green');
  });

  it('returns red for failed', () => {
    expect(getLabelColorFromStatus(runStatus.Failed)).toBe('red');
  });

  it('returns gold for cancelled/cancelling status', () => {
    expect(getLabelColorFromStatus(runStatus.Cancelled)).toBe('gold');
    expect(getLabelColorFromStatus(runStatus.Cancelling)).toBe('gold');
  });

  it('returns blue for running and in-progress statuses', () => {
    expect(getLabelColorFromStatus(runStatus.Running)).toBe('blue');
    expect(getLabelColorFromStatus(runStatus['In Progress'])).toBe('blue');
  });
});
