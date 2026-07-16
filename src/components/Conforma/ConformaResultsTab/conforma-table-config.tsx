import { CONFORMA_RESULT_STATUS, type ConformaResultRow } from '~/types/conforma';
import { defineFilters } from '~/shared/components/Filter';
import { textMatch } from '~/utils/text-filter-utils';
import type { ColumnDefinition } from '~/shared/components/TableV2';
import type { GroupedConformaRow } from './conforma-grouping-utils';
import { ConformaCountBadge } from './ConformaCountBadge';

export const buildConformaGroupedColumns = (
  groupLabel: string,
): ColumnDefinition<GroupedConformaRow>[] => [
  {
    id: 'groupKey',
    header: groupLabel,
    accessorFn: (row) => row.groupKey,
    size: 4,
  },
  {
    id: 'violations',
    header: 'Violations',
    accessorFn: (row) => row.violations,
    size: 2,
    cell: (info) => (
      <ConformaCountBadge
        count={info.getValue() as number}
        type={CONFORMA_RESULT_STATUS.violations}
      />
    ),
  },
  {
    id: 'warnings',
    header: 'Warnings',
    accessorFn: (row) => row.warnings,
    size: 2,
    cell: (info) => (
      <ConformaCountBadge
        count={info.getValue() as number}
        type={CONFORMA_RESULT_STATUS.warnings}
      />
    ),
  },
  {
    id: 'successes',
    header: 'Successes',
    accessorFn: (row) => row.successes,
    size: 2,
    cell: (info) => (
      <ConformaCountBadge
        count={info.getValue() as number}
        type={CONFORMA_RESULT_STATUS.successes}
      />
    ),
  },
];

export const filterConfigs = defineFilters<ConformaResultRow>()([
  {
    type: 'search',
    param: 'name',
    label: 'Rule or component',
    filterFn: (item, value) =>
      textMatch(item.code ?? '', value) ||
      textMatch(item.title, value) ||
      textMatch(item.component, value),
  },
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    filterFn: (item, selectedValues) => selectedValues.includes(item.status),
  },
] as const);

export const STATUS_FILTER_OPTIONS = [
  { label: 'Violations', value: CONFORMA_RESULT_STATUS.violations },
  { label: 'Warnings', value: CONFORMA_RESULT_STATUS.warnings },
  { label: 'Successes', value: CONFORMA_RESULT_STATUS.successes },
];
