import type { LabelProps } from '@patternfly/react-core';
import { t_chart_color_green_100 as successColor } from '@patternfly/react-tokens/dist/js/t_chart_color_green_100';
import { t_global_color_brand_100 as inProgressColor } from '@patternfly/react-tokens/dist/js/t_global_color_brand_100';
import { t_global_color_severity_undefined_100 as neutralColor } from '@patternfly/react-tokens/dist/js/t_global_color_severity_undefined_100';
import { t_global_color_status_warning_100 as warningColor } from '@patternfly/react-tokens/dist/js/t_global_color_status_warning_100';
import { t_global_icon_color_status_danger_default as dangerColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { runStatus } from '~/consts/pipelinerun';

const STATUS_COLORS = {
  danger: { hex: dangerColor.value, name: 'red' },
  success: { hex: successColor.value, name: 'green' },
  warning: { hex: warningColor.value, name: 'yellow' },
  skipped: { hex: neutralColor.value, name: 'grey' },
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
