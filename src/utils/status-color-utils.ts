import type { LabelProps } from '@patternfly/react-core';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_info_color_100 as inProgressColor } from '@patternfly/react-tokens/dist/js/global_info_color_100';
import { global_palette_black_400 as neutralColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_secondary_color_100 as skippedColor } from '@patternfly/react-tokens/dist/js/global_secondary_color_100';
import { global_success_color_100 as successColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { runStatus } from '~/consts/pipelinerun';

const STATUS_COLORS = {
  danger: { hex: dangerColor.value, name: 'red' },
  success: { hex: successColor.value, name: 'green' },
  warning: { hex: warningColor.value, name: 'gold' },
  skipped: { hex: skippedColor.value, name: 'grey' },
  inProgress: { hex: inProgressColor.value, name: 'blue' },
  neutral: { hex: neutralColor.value, name: 'grey' },
} as const;

type StatusColorCategory = keyof typeof STATUS_COLORS;
type StatusColorName = NonNullable<LabelProps['color']>;

const runStatusColorCategory: Record<runStatus, StatusColorCategory> = {
  [runStatus.Succeeded]: 'success',
  [runStatus.Failed]: 'danger',
  [runStatus.Running]: 'inProgress',
  [runStatus['In Progress']]: 'inProgress',
  [runStatus.FailedToStart]: 'danger',
  [runStatus.PipelineNotStarted]: 'danger',
  [runStatus.NeedsMerge]: 'neutral',
  [runStatus.Skipped]: 'skipped',
  [runStatus.Cancelled]: 'warning',
  [runStatus.Cancelling]: 'warning',
  [runStatus.Pending]: 'neutral',
  [runStatus.Idle]: 'neutral',
  [runStatus.TestWarning]: 'warning',
  [runStatus.TestFailed]: 'warning',
  [runStatus.Unknown]: 'neutral',
};

const getStatusColorCategory = (status: runStatus): StatusColorCategory =>
  runStatusColorCategory[status] ?? 'neutral';

export const getStatusColor = (status: runStatus): string =>
  STATUS_COLORS[getStatusColorCategory(status)].hex;

export const getStatusColorName = (status: runStatus): StatusColorName =>
  STATUS_COLORS[getStatusColorCategory(status)].name;
