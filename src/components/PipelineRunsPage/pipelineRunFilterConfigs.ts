import { PipelineRunLabel } from '~/consts/pipelinerun';
import { MultiSelectFilterConfig, SwitchableSearchFilterConfig } from '~/shared/components/Filter';
import { PipelineRunKind } from '~/types';
import { PLRStatus } from '~/utils/plr-status-config';
import { textMatch } from '~/utils/text-filter-utils';

export {
  pipelineTypeFilterConfig as plrTypeFilterConfig,
  eventTypeFilterConfig as plrEventTypeFilterConfig,
} from '~/utils/pipeline-run-filter-utils';

export const plrNameSearchConfig = {
  type: 'switchableSearch',
  param: 'searchField',
  label: 'Search',
  group: 'search',
  fields: [
    {
      label: 'Name',
      value: 'name',
      param: 'name',
      filterFn: (item, value) => textMatch(item.metadata?.name, value, { trim: false }),
    },
    {
      label: 'PR number',
      value: 'prNumber',
      param: 'prNumber',
      multiValue: true,
      filterFn: (item, value) =>
        (item.metadata?.labels?.[PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL] ?? '') === value,
    },
  ],
} as const satisfies SwitchableSearchFilterConfig<PipelineRunKind>;

export const plrStatusFilterConfig: MultiSelectFilterConfig<PipelineRunKind> = {
  type: 'multiSelect',
  param: 'status',
  label: 'Status',
  filterFn: PLRStatus.statusFilterFn,
  group: 'attributes',
};
