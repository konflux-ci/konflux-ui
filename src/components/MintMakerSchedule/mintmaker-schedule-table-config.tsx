import { Truncate } from '@patternfly/react-core';
import { MintMakerScheduleEntry } from '~/hooks/useMintMakerSchedule';
import { Countdown, Timestamp } from '~/shared';
import { defineFilters } from '~/shared/components/Filter';
import { ColumnDefinition } from '~/shared/components/TableV2';
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

export const mintMakerScheduleTableColumns: ColumnDefinition<MintMakerScheduleEntry>[] = [
  {
    id: 'manager',
    header: 'Manager',
    accessorFn: (row) => row.manager,
    nonHidable: true,
    cell: (info) => (
      <span data-test="mintmaker-schedule-manager">
        <Truncate content={(info.getValue() as string) ?? ''} />
      </span>
    ),
  },
  {
    id: 'next-run',
    header: 'Next run',
    accessorFn: (row) => row.nextRun,
    nonHidable: true,
    cell: (info) => {
      return (
        <span data-test="mintmaker-schedule-next-run">
          <Timestamp timestamp={(info.getValue() as string) ?? ''} />
        </span>
      );
    },
  },
  {
    id: 'next-run-in',
    header: 'Next run in',
    accessorFn: (row) => row.nextRun,
    nonHidable: true,
    cell: (info) => (
      <span data-test="mintmaker-schedule-next-run-in">
        <Countdown timestamp={(info.getValue() as string) ?? ''} />
      </span>
    ),
  },
];
