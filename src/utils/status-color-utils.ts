import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_info_color_100 as inProgressColor } from '@patternfly/react-tokens/dist/js/global_info_color_100';
import { global_palette_black_400 as neutralColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_secondary_color_100 as skippedColor } from '@patternfly/react-tokens/dist/js/global_secondary_color_100';
import { global_success_color_100 as successColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { RunStatus } from '@patternfly/react-topology';
import { runStatus } from '~/consts/pipelinerun';
import { runStatusToRunStatus } from '~/utils/pipeline-utils';

export const STATUS_COLOR = {
  danger: dangerColor.value,
  success: successColor.value,
  warning: warningColor.value,
  skipped: skippedColor.value,
  inProgress: inProgressColor.value,
  neutral: neutralColor.value,
} as const;

export type StatusColorCategory = keyof typeof STATUS_COLOR;

export type LabelColor = 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey' | 'gold';

type StatusVisualConfig = {
  /** Hex color bucket for canvas rendering (e.g. favicon badge). */
  canvas: StatusColorCategory;
  /** PatternFly Label color prop; null means no label tint. */
  label: LabelColor | null;
};

export const RUN_STATUS_VISUAL_CONFIG: Record<RunStatus, StatusVisualConfig> = {
  [RunStatus.Failed]: { canvas: 'danger', label: 'red' },
  [RunStatus.FailedToStart]: { canvas: 'danger', label: null },
  [RunStatus.Succeeded]: { canvas: 'success', label: 'green' },
  [RunStatus.Cancelled]: { canvas: 'warning', label: 'gold' },
  [RunStatus.Skipped]: { canvas: 'skipped', label: null },
  [RunStatus.Running]: { canvas: 'neutral', label: 'blue' },
  [RunStatus.InProgress]: { canvas: 'inProgress', label: 'blue' },
  [RunStatus.Pending]: { canvas: 'neutral', label: null },
  [RunStatus.Idle]: { canvas: 'neutral', label: null },
};

const getVisualConfig = (status: runStatus): StatusVisualConfig =>
  RUN_STATUS_VISUAL_CONFIG[runStatusToRunStatus(status)];

export const getStatusColor = (status: runStatus): string =>
  STATUS_COLOR[getVisualConfig(status).canvas];

export const getLabelColorFromStatus = (status: runStatus): LabelColor | null => {
  if (status === runStatus.TestFailed || status === runStatus.TestWarning) {
    return null;
  }
  return getVisualConfig(status).label;
};
