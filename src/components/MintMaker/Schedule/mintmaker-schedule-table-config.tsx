import { capitalize } from 'lodash-es';
import type { MintMakerScheduleEntry } from '~/hooks/useMintMakerSchedule';
import { Countdown } from '~/shared';
import { defineFilters } from '~/shared/components/Filter';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { textMatch } from '~/utils/text-filter-utils';

export const MINTMAKER_SCHEDULE_COLUMN_STATE_KEY = 'mintmaker-schedule-list';

export const getMintMakerScheduleTableColumns = (): ColumnDefinition<MintMakerScheduleEntry>[] => [
  {
    id: 'manager',
    header: 'Manager',
    accessorFn: (row) => row.manager,
    size: 1,
    nonHidable: true,
    cell: (info) => (
      <span data-test="mintmaker-schedule-manager">{capitalize(info.getValue() as string)}</span>
    ),
  },
  {
    id: 'nextRun',
    header: 'Next scheduled run',
    accessorFn: (row) => row.scheduledRuns[0] ?? '',
    size: 1,
    nonHidable: true,
    cell: (info) => {
      const timestamp = info.getValue() as string;
      return (
        <span data-test="mintmaker-schedule-next-run">
          {timestamp ? (
            <span data-test="mintmaker-schedule-next-countdown">
              <Countdown timestamp={timestamp} simple />
            </span>
          ) : (
            '-'
          )}
        </span>
      );
    },
  },
];

export const mintMakerScheduleFilterConfig = defineFilters<MintMakerScheduleEntry>()([
  {
    type: 'search',
    param: 'manager',
    label: 'Manager',
    mode: 'client',
    filterFn: (item, value) => textMatch(item.manager, value),
  },
]);
