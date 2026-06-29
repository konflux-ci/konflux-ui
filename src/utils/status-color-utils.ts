import { global_danger_color_100 as redColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_palette_black_400 as grayColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_gold_400 as goldColor } from '@patternfly/react-tokens/dist/js/global_palette_gold_400';
import { global_palette_orange_300 as orangeColor } from '@patternfly/react-tokens/dist/js/global_palette_orange_300';
import { global_success_color_100 as greenColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { runStatus } from '~/consts/pipelinerun';

/** Canvas hex colors for favicon badges. For PatternFly Label colors, see getLabelColorFromStatus in pipeline-utils. */
export const getColorForPipelineStatus = (status: runStatus): string => {
  switch (status) {
    case runStatus.Succeeded:
      return greenColor.value;
    case runStatus.Failed:
    case runStatus.FailedToStart:
    case runStatus.TestFailed:
      return redColor.value;
    case runStatus.Running:
    case runStatus['In Progress']:
      return blueColor.value;
    case runStatus.Cancelled:
    case runStatus.Cancelling:
      return goldColor.value;
    case runStatus.TestWarning:
      return warningColor.value;
    case runStatus.PipelineNotStarted:
      return orangeColor.value;
    case runStatus.Idle:
    case runStatus.Pending:
    case runStatus.Skipped:
    case runStatus.Unknown:
    case runStatus.NeedsMerge:
    default:
      return grayColor.value;
  }
};

/** Maps release status values (a subset of runStatus) to favicon badge colors. */
export const getColorForReleaseStatus = (status: runStatus): string => {
  switch (status) {
    case runStatus.Succeeded:
      return greenColor.value;
    case runStatus.Failed:
      return redColor.value;
    case runStatus['In Progress']:
      return blueColor.value;
    case runStatus.Pending:
    case runStatus.Unknown:
    default:
      return grayColor.value;
  }
};
