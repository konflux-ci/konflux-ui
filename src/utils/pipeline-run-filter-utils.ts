import { PipelineRunEventType, runStatus } from '~/consts/pipelinerun';
import { FilterOption, MultiSelectFilterConfig } from '~/shared/components/Filter';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

/** Display labels for pipeline run event types. */
export const PipelineRunEventTypeLabel: Record<string, string> = {
  [PipelineRunEventType.PUSH]: 'Push',
  [PipelineRunEventType.GITLAB_PUSH]: 'Push',
  [PipelineRunEventType.PULL]: 'Pull Request',
  [PipelineRunEventType.INCOMING]: 'Incoming',
  [PipelineRunEventType.RETEST]: 'Retest All Comment',
  [PipelineRunEventType.TEST_ALL_COMMENT]: 'Test All Comment',
};

/** Converts a raw event-type string (e.g. `'some-new-event'`) into a human-readable label. */
const humanizeEventType = (raw: string): string => {
  const str = raw.replace(/-/g, ' ');
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Returns the display label for a pipeline run event type, with provider-aware
 * distinction between "Pull Request" (GitHub, etc.) and "Merge Request" (GitLab).
 */
export const getEventTypeLabel = (eventType?: string, gitProvider?: string): string => {
  if (!eventType) return '-';
  if (eventType === PipelineRunEventType.PULL && gitProvider === 'gitlab') {
    return 'Merge Request';
  }
  return PipelineRunEventTypeLabel[eventType] ?? humanizeEventType(eventType);
};

/**
 * Event types that should be excluded from the filter dropdown because they
 * duplicate another entry (same label, different raw value).
 * When the user selects "Push", the API filter must send both `push` and `Push`.
 */
const DUPLICATE_EVENT_TYPES = new Set<string>([PipelineRunEventType.GITLAB_PUSH]);

/** Static filter options for pipeline run event types. */
export const PIPELINE_RUN_EVENT_TYPE_OPTIONS: FilterOption[] = Object.values(PipelineRunEventType)
  .filter((v) => !DUPLICATE_EVENT_TYPES.has(v))
  .map((value) => ({
    label: PipelineRunEventTypeLabel[value] ?? value,
    value,
  }));

/** Static filter options for pipeline run types. */
export const PIPELINE_RUN_TYPE_OPTIONS: FilterOption[] = [
  { label: 'Build', value: 'build' },
  { label: 'Test', value: 'test' },
  { label: 'Final', value: 'final' },
];

export const PIPELINE_RUN_STATUS_OPTIONS: FilterOption[] = Object.values(runStatus).map((s) => ({
  label: s,
  value: s,
}));

/** Reusable event type filter config (api-mode, label selector). */
export const eventTypeFilterConfig: MultiSelectFilterConfig<PipelineRunKind> = {
  type: 'multiSelect',
  param: 'eventType',
  label: 'Event type',
  mode: 'api',
};

/** Reusable pipeline type filter config (api-mode, label selector). */
export const pipelineTypeFilterConfig: MultiSelectFilterConfig<PipelineRunKind> = {
  type: 'multiSelect',
  param: 'type',
  label: 'Type',
  mode: 'api',
};

/** Reusable status filter config (client-mode). */
export const statusFilterConfig: MultiSelectFilterConfig<PipelineRunKind> = {
  type: 'multiSelect',
  param: 'status',
  label: 'Status',
  filterFn: (item, values) => values.includes(pipelineRunStatus(item)),
};
