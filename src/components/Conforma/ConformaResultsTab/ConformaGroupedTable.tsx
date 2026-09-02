import * as React from 'react';
import { type ExpandedState } from '@tanstack/react-table';
import { Table as TableV2, type ColumnDefinition } from '~/shared/components/TableV2';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { GroupByMode, GroupedConformaRow } from './conforma-grouping-utils';
import { ConformaCountBadge } from './ConformaCountBadge';
import { DetailSubTable } from './DetailSubTable';
import './ConformaResultsTab.scss';

type ConformaGroupedTableProps = {
  groups: GroupedConformaRow[];
  groupBy: GroupByMode;
  expandedGroups: Set<string>;
  onExpandedGroupsChange: (groups: Set<string>) => void;
};

const getGroupedColumns = (groupLabel: string): ColumnDefinition<GroupedConformaRow, unknown>[] => [
  {
    id: 'group',
    header: groupLabel,
    accessorFn: (row) => row.groupKey,
    cell: (info) => <strong>{info.getValue() as string}</strong>,
    size: 3,
  },
  {
    id: 'violations',
    header: 'Violations',
    accessorFn: (row) => row.violations,
    cell: (info) => (
      <ConformaCountBadge
        count={info.getValue() as number}
        type={CONFORMA_RESULT_STATUS.violations}
      />
    ),
    size: 1,
  },
  {
    id: 'warnings',
    header: 'Warnings',
    accessorFn: (row) => row.warnings,
    cell: (info) => (
      <ConformaCountBadge
        count={info.getValue() as number}
        type={CONFORMA_RESULT_STATUS.warnings}
      />
    ),
    size: 1,
  },
  {
    id: 'successes',
    header: 'Successes',
    accessorFn: (row) => row.successes,
    cell: (info) => (
      <ConformaCountBadge
        count={info.getValue() as number}
        type={CONFORMA_RESULT_STATUS.successes}
      />
    ),
    size: 1,
  },
];

export const ConformaGroupedTable: React.FC<ConformaGroupedTableProps> = ({
  groups,
  groupBy,
  expandedGroups,
  onExpandedGroupsChange,
}) => {
  const groupLabel = groupBy === 'rule' ? 'Rule' : 'Component';

  // Convert Set<string> to ExpandedState (Record<string, boolean>)
  const expanded = React.useMemo<ExpandedState>(() => {
    const state: Record<string, boolean> = {};
    expandedGroups.forEach((key) => {
      state[key] = true;
    });
    return state;
  }, [expandedGroups]);

  // Handle expansion changes from TableV2
  const handleExpandedChange = React.useCallback(
    (updaterOrValue: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(expanded) : updaterOrValue;
      onExpandedGroupsChange(
        next === true
          ? new Set(groups.map((group) => group.groupKey))
          : new Set(
              Object.entries(next)
                .filter(([, isExpanded]) => isExpanded)
                .map(([key]) => key),
            ),
      );
    },
    [expanded, groups, onExpandedGroupsChange],
  );

  const columns = React.useMemo(() => getGroupedColumns(groupLabel), [groupLabel]);

  return (
    <TableV2
      data={groups}
      columns={columns}
      getRowId={(row) => row.groupKey}
      aria-label="Conforma results grouped table"
      data-test="conforma-grouped-table"
      enableExpansion
      expanded={expanded}
      onExpandedChange={handleExpandedChange}
      expandedContent={(row) => <DetailSubTable rows={row.rows} />}
    />
  );
};
