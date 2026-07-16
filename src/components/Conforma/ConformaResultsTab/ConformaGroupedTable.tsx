import * as React from 'react';
import { Content, Tooltip, Truncate as PfTruncate } from '@patternfly/react-core';
import { Table as PfTable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { getRuleStatus } from '~/components/Conforma/utils';
import { Table, type ExpandedState, type OnChangeFn } from '~/shared/components/TableV2';
import { Truncate } from '~/shared/components/truncate-text/Truncate';
import type { ConformaResultRow } from '~/types/conforma';
import type { GroupByMode, GroupedConformaRow } from './conforma-grouping-utils';
import { getCommonImageName } from './conforma-grouping-utils';
import { buildConformaGroupedColumns } from './conforma-table-config';
import './ConformaResultsTab.scss';

type ConformaGroupedTableProps = {
  groups: GroupedConformaRow[];
  groupBy: GroupByMode;
  expanded: ExpandedState;
  onExpandedChange: OnChangeFn<ExpandedState>;
};

const DetailSubTable: React.FC<{ rows: ConformaResultRow[] }> = ({ rows }) => (
  <PfTable
    aria-label="Conforma detail rows"
    variant="compact"
    borders={false}
    className="conforma-results-tab__detail-table"
  >
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
      {rows.map((row, idx) => {
        const commonName = row.images.length > 1 ? getCommonImageName(row.images) : undefined;
        return (
          <Tr key={`${row.component}-${row.title}-${idx}`}>
            <Td dataLabel="Rule">
              <Content>
                <Content component="p">
                  <strong>{row.title ?? '-'}</strong>
                </Content>
                {row.code && <Content component="small">{row.code}</Content>}
                {row.description && <Content component="small">{row.description}</Content>}
              </Content>
            </Td>
            <Td dataLabel="Component">{row.component}</Td>
            <Td dataLabel="Image">
              {row.images.length > 1 ? (
                <Tooltip
                  content={
                    <ul>
                      {row.images.map((img) => (
                        <li key={img}>{img}</li>
                      ))}
                    </ul>
                  }
                >
                  <Content>
                    {commonName ? (
                      <>
                        <Content component="p">
                          <PfTruncate content={commonName} />
                        </Content>
                        <Content component="small">{row.images.length} arch variants</Content>
                      </>
                    ) : (
                      <Content component="p">Affects {row.images.length} images</Content>
                    )}
                  </Content>
                </Tooltip>
              ) : row.images.length === 1 ? (
                <PfTruncate content={row.images[0]} />
              ) : (
                '-'
              )}
            </Td>
            <Td dataLabel="Status">{getRuleStatus(row.status)}</Td>
            <Td dataLabel="Message">
              <Content>
                <Content component="p">
                  {row.msg != null ? (
                    <Truncate content={row.msg} expandInline data-test="conforma-violation-msg" />
                  ) : (
                    '-'
                  )}
                </Content>
                {row.solution && <Content component="small">Solution: {row.solution}</Content>}
              </Content>
            </Td>
          </Tr>
        );
      })}
    </Tbody>
  </PfTable>
);

export const ConformaGroupedTable: React.FC<ConformaGroupedTableProps> = ({
  groups,
  groupBy,
  expanded,
  onExpandedChange,
}) => {
  const groupLabel = groupBy === 'rule' ? 'Rule' : 'Component';
  const columns = React.useMemo(() => buildConformaGroupedColumns(groupLabel), [groupLabel]);

  return (
    <div data-test="conforma-grouped-table">
      <Table
        data={groups}
        columns={columns}
        getRowId={(g) => g.groupKey}
        aria-label="Conforma results grouped table"
        enableExpansion
        expandedContent={(group) => <DetailSubTable rows={group.rows} />}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      />
    </div>
  );
};
