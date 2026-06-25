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
};

/** Static filter options for pipeline run event types. */
export const PIPELINE_RUN_EVENT_TYPE_OPTIONS: FilterOption[] = Object.values(
  PipelineRunEventType,
).map((value) => ({
  label: PipelineRunEventTypeLabel[value] ?? value,
  value,
}));

/** Static filter options for pipeline run types. */
export const PIPELINE_RUN_TYPE_OPTIONS: FilterOption[] = [
  { label: 'Build', value: 'build' },
  { label: 'Test', value: 'test' },
  { label: 'Final', value: 'final' },
];

/** Static filter options for pipeline run statuses. */
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
