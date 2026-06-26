import { global_danger_color_100 as redColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_palette_black_400 as grayColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_gold_400 as goldColor } from '@patternfly/react-tokens/dist/js/global_palette_gold_400';
import { global_palette_orange_300 as orangeColor } from '@patternfly/react-tokens/dist/js/global_palette_orange_300';
import { global_success_color_100 as greenColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { runStatus } from '~/consts/pipelinerun';
import {
  getColorForPipelineStatus,
  getColorForReleaseStatus,
} from '~/shared/utils/status-color-utils';

describe('getColorForPipelineStatus', () => {
  it.each([
    [runStatus.Succeeded, greenColor.value],
    [runStatus.Failed, redColor.value],
    [runStatus.FailedToStart, redColor.value],
    [runStatus.TestFailed, redColor.value],
    [runStatus.Running, blueColor.value],
    [runStatus['In Progress'], blueColor.value],
    [runStatus.Cancelled, goldColor.value],
    [runStatus.Cancelling, goldColor.value],
    [runStatus.TestWarning, warningColor.value],
    [runStatus.PipelineNotStarted, orangeColor.value],
    [runStatus.Idle, grayColor.value],
    [runStatus.Pending, grayColor.value],
    [runStatus.Skipped, grayColor.value],
    [runStatus.Unknown, grayColor.value],
    [runStatus.NeedsMerge, grayColor.value],
  ])('maps %s to %s', (status, expected) => {
    expect(getColorForPipelineStatus(status)).toBe(expected);
  });
});

describe('getColorForReleaseStatus', () => {
  it.each([
    [runStatus.Succeeded, greenColor.value],
    [runStatus.Failed, redColor.value],
    [runStatus['In Progress'], blueColor.value],
    [runStatus.Pending, grayColor.value],
    [runStatus.Unknown, grayColor.value],
  ])('maps %s to %s', (status, expected) => {
    expect(getColorForReleaseStatus(status)).toBe(expected);
  });
});
