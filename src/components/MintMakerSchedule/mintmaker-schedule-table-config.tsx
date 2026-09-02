import { MintMakerScheduleEntry } from '~/hooks/useMintMakerSchedule';
import { defineFilters } from '~/shared/components/Filter';
import { textMatch } from '~/utils/text-filter-utils';

export const mintMakerScheduleFilterConfig = defineFilters<MintMakerScheduleEntry>()([
  {
    type: 'search',
    param: 'manager',
    label: 'Manager',
    mode: 'client',
    filterFn: (item, value) => textMatch(item.manager, value),
  },
]);
