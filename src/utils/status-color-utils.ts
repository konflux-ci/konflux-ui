import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_info_color_100 as inProgressColor } from '@patternfly/react-tokens/dist/js/global_info_color_100';
import { global_palette_black_400 as neutralColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_secondary_color_100 as skippedColor } from '@patternfly/react-tokens/dist/js/global_secondary_color_100';
import { global_success_color_100 as successColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { RunStatus } from '@patternfly/react-topology';
import { runStatus } from '~/consts/pipelinerun';
import { runStatusToRunStatus } from '~/utils/pipeline-utils';

/** Hex colors matching PatternFly topology pipeline status icons used in list views. */
export const STATUS_COLOR = {
  danger: dangerColor.value,
  success: successColor.value,
  warning: warningColor.value,
  skipped: skippedColor.value,
  inProgress: inProgressColor.value,
  neutral: neutralColor.value,
} as const;

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

/** Returns the canvas hex color for a run status. */
export const getStatusColor = (status: runStatus): string =>
  topologyStatusColor[runStatusToRunStatus(status)];
