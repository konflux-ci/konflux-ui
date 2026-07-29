import { t_chart_color_green_100 as successColor } from '@patternfly/react-tokens/dist/js/t_chart_color_green_100';
import { t_global_color_brand_100 as inProgressColor } from '@patternfly/react-tokens/dist/js/t_global_color_brand_100';
import { t_global_color_severity_undefined_100 as neutralColor } from '@patternfly/react-tokens/dist/js/t_global_color_severity_undefined_100';
import { t_global_color_status_warning_100 as warningColor } from '@patternfly/react-tokens/dist/js/t_global_color_status_warning_100';
import { t_global_icon_color_status_danger_default as dangerColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
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
    [runStatus.Skipped, neutralColor.value],
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
    [runStatus.TestFailed, 'yellow'],
    [runStatus.Running, 'blue'],
    [runStatus.Pending, 'grey'],
    [runStatus['In Progress'], 'blue'],
    [runStatus.Cancelled, 'yellow'],
    [runStatus.Cancelling, 'yellow'],
    [runStatus.TestWarning, 'yellow'],
    [runStatus.PipelineNotStarted, 'red'],
    [runStatus.Idle, 'grey'],
    [runStatus.Skipped, 'grey'],
    [runStatus.Unknown, 'grey'],
    [runStatus.NeedsMerge, 'grey'],
  ])('maps %s to %s', (status, expected) => {
    expect(getStatusColorName(status)).toBe(expected);
  });
});
