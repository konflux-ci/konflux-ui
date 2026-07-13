import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_info_color_100 as inProgressColor } from '@patternfly/react-tokens/dist/js/global_info_color_100';
import { global_palette_black_400 as neutralColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_secondary_color_100 as skippedColor } from '@patternfly/react-tokens/dist/js/global_secondary_color_100';
import { global_success_color_100 as successColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { runStatus } from '~/consts/pipelinerun';
import { getStatusColor, getStatusColorName } from '~/utils/status-color-utils';

describe('getStatusColor', () => {
  it.each([
    [runStatus.Succeeded, successColor.value],
    [runStatus.Failed, dangerColor.value],
    [runStatus.FailedToStart, dangerColor.value],
    [runStatus.TestFailed, warningColor.value],
    [runStatus.Running, inProgressColor.value],
    [runStatus.Pending, neutralColor.value],
    [runStatus['In Progress'], inProgressColor.value],
    [runStatus.Cancelled, warningColor.value],
    [runStatus.Cancelling, warningColor.value],
    [runStatus.TestWarning, warningColor.value],
    [runStatus.PipelineNotStarted, dangerColor.value],
    [runStatus.Idle, neutralColor.value],
    [runStatus.Skipped, skippedColor.value],
    [runStatus.Unknown, neutralColor.value],
    [runStatus.NeedsMerge, neutralColor.value],
  ])('maps %s to %s', (status, expected) => {
    expect(getStatusColor(status)).toBe(expected);
  });
});

describe('getStatusColorName', () => {
  it.each([
    [runStatus.Succeeded, 'green'],
    [runStatus.Failed, 'red'],
    [runStatus.FailedToStart, 'red'],
    [runStatus.TestFailed, 'gold'],
    [runStatus.Running, 'blue'],
    [runStatus.Pending, 'grey'],
    [runStatus['In Progress'], 'blue'],
    [runStatus.Cancelled, 'gold'],
    [runStatus.Cancelling, 'gold'],
    [runStatus.TestWarning, 'gold'],
    [runStatus.PipelineNotStarted, 'red'],
    [runStatus.Idle, 'grey'],
    [runStatus.Skipped, 'grey'],
    [runStatus.Unknown, 'grey'],
    [runStatus.NeedsMerge, 'grey'],
  ])('maps %s to %s', (status, expected) => {
    expect(getStatusColorName(status)).toBe(expected);
  });
});
