import * as React from 'react';
import { Text, TextContent, Truncate as PfTruncate } from '@patternfly/react-core';
import {
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { getRuleStatus } from '~/components/Conforma/utils';
import type { ComponentProps } from '~/shared/components/table/Table';
import { Truncate } from '~/shared/components/truncate-text/Truncate';
import type { ConformaResultRow } from '~/types/conforma';
import type { GroupByMode, GroupedConformaRow } from './conforma-grouping-utils';
import { getConformaGroupedHeader } from './ConformaResultsListHeader';
import ConformaResultsListRow from './ConformaResultsListRow';
import './ConformaResultsTab.scss';

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
            <TextContent>
              <Text component="p">
                <strong>{row.title ?? '-'}</strong>
              </Text>
              {row.description && <Text component="small">{row.description}</Text>}
            </TextContent>
          </Td>
          <Td dataLabel="Component">{row.component}</Td>
          <Td dataLabel="Image">
            {row.image ? <PfTruncate content={row.image} /> : '-'}
          </Td>
          <Td dataLabel="Status">{getRuleStatus(row.status)}</Td>
          <Td dataLabel="Message">
            <TextContent>
              <Text component="p">
                {row.msg ? (
                  <Truncate
                    content={row.msg}
                    expandInline
                    data-test="conforma-violation-msg"
                  />
                ) : (
                  '-'
                )}
              </Text>
              {row.solution && <Text component="small">Solution: {row.solution}</Text>}
            </TextContent>
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

  // Build column definitions using the shared createTableHeaders utility so
  // the header config follows the same pattern as other table components.
  const headerColumns = React.useMemo(
    () => getConformaGroupedHeader(groupLabel)({} as ComponentProps<unknown>),
    [groupLabel],
  );

  return (
    <Table aria-label="Conforma results grouped table" data-test="conforma-grouped-table">
      <Thead>
        <Tr>
          <Th screenReaderText="Expand" />
          {headerColumns.map((col) => (
            <Th key={String(col.title)} {...col.props}>
              {col.title}
            </Th>
          ))}
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
              {/* Reuse the shared Row fragment for the main summary cells */}
              <ConformaResultsListRow obj={group} />
            </Tr>
            <Tr isExpanded={isExpanded}>
              <Td colSpan={headerColumns.length + 1} noPadding={false}>
                <ExpandableRowContent>
                  {isExpanded && <DetailSubTable rows={group.rows} />}
                </ExpandableRowContent>
              </Td>
            </Tr>
          </Tbody>
        );
      })}
    </Table>
  );
};
