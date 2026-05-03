import * as React from 'react';
import { Truncate } from '@patternfly/react-core';
import {
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { getRuleStatus } from '~/utils/conforma-utils';
import type { GroupByMode, GroupedConformaRow } from './conforma-grouping-utils';
import { ConformaCountBadge } from './ConformaCountBadge';
import type { ConformaResultRow } from './useApplicationConformaResults';

type ConformaGroupedTableProps = {
  groups: GroupedConformaRow[];
  groupBy: GroupByMode;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
};

const DetailSubTable: React.FC<{ rows: ConformaResultRow[] }> = ({ rows }) => (
  <Table aria-label="Conforma detail rows" variant="compact" borders={false}>
    <Thead>
      <Tr>
        <Th width={20}>Rule</Th>
        <Th width={15}>Component</Th>
        <Th width={25}>Image</Th>
        <Th width={10}>Status</Th>
        <Th width={30}>Message</Th>
      </Tr>
    </Thead>
    <Tbody>
      {rows.map((row, idx) => (
        <Tr key={`${row.component}-${row.title}-${idx}`}>
          <Td dataLabel="Rule">
            <div>
              <strong>{row.title ?? '-'}</strong>
            </div>
            {row.description && (
              <div style={{ fontSize: 'var(--pf-v5-global--FontSize--sm)', color: 'var(--pf-v5-global--Color--200)' }}>
                {row.description}
              </div>
            )}
          </Td>
          <Td dataLabel="Component">{row.component}</Td>
          <Td dataLabel="Image">
            {row.image ? (
              <Truncate content={row.image} />
            ) : (
              '-'
            )}
          </Td>
          <Td dataLabel="Status">{getRuleStatus(row.status)}</Td>
          <Td dataLabel="Message">
            <div>{row.msg ?? '-'}</div>
            {row.solution && (
              <div style={{ fontSize: 'var(--pf-v5-global--FontSize--sm)', color: 'var(--pf-v5-global--Color--200)' }}>
                Solution: {row.solution}
              </div>
            )}
          </Td>
        </Tr>
      ))}
    </Tbody>
  </Table>
);

export const ConformaGroupedTable: React.FC<ConformaGroupedTableProps> = ({
  groups,
  groupBy,
  expandedGroups,
  onToggleGroup,
}) => {
  const groupLabel = groupBy === 'rule' ? 'Rule' : 'Component';

  return (
    <Table aria-label="Conforma results grouped table" data-test="conforma-grouped-table">
      <Thead>
        <Tr>
          <Th screenReaderText="Expand" />
          <Th>{groupLabel}</Th>
          <Th>Violations</Th>
          <Th>Warnings</Th>
          <Th>Successes</Th>
        </Tr>
      </Thead>
      {groups.map((group, groupIdx) => {
        const isExpanded = expandedGroups.has(group.groupKey);
        const rowId = `conforma-group-${groupIdx}`;

        return (
          <Tbody key={group.groupKey} isExpanded={isExpanded}>
            <Tr>
              <Td
                expand={{
                  rowIndex: groupIdx,
                  isExpanded,
                  onToggle: () => onToggleGroup(group.groupKey),
                  expandId: `${rowId}-expand`,
                }}
              />
              <Td dataLabel={groupLabel}>{group.groupKey}</Td>
              <Td dataLabel="Violations">
                <ConformaCountBadge count={group.violations} type="violations" />
              </Td>
              <Td dataLabel="Warnings">
                <ConformaCountBadge count={group.warnings} type="warnings" />
              </Td>
              <Td dataLabel="Successes">
                <ConformaCountBadge count={group.successes} type="successes" />
              </Td>
            </Tr>
            <Tr isExpanded={isExpanded}>
              <Td colSpan={5} noPadding={false}>
                <ExpandableRowContent>
                  <DetailSubTable rows={group.rows} />
                </ExpandableRowContent>
              </Td>
            </Tr>
          </Tbody>
        );
      })}
    </Table>
  );
};
