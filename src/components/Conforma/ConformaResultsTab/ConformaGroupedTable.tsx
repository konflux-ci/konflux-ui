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

const RuleCell: React.FC<Pick<ConformaResultRow, 'title' | 'code' | 'description'>> = ({
  title,
  code,
  description,
}) => (
  <Content>
    <Content component="p">
      <strong>{title ?? '-'}</strong>
    </Content>
    {code && <Content component="small">{code}</Content>}
    {description && <Content component="small">{description}</Content>}
  </Content>
);

const ImageCell: React.FC<{ images: string[] }> = ({ images }) => {
  if (images.length > 1) {
    const commonName = getCommonImageName(images);
    return (
      <Tooltip
        content={
          <ul>
            {images.map((img) => (
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
              <Content component="small">{images.length} arch variants</Content>
            </>
          ) : (
            <Content component="p">Affects {images.length} images</Content>
          )}
        </Content>
      </Tooltip>
    );
  }
  if (images.length === 1) {
    return <PfTruncate content={images[0]} />;
  }
  return <>-</>;
};

const MessageCell: React.FC<Pick<ConformaResultRow, 'msg' | 'solution'>> = ({ msg, solution }) => (
  <Content>
    <Content component="p">
      {msg != null ? (
        <Truncate content={msg} expandInline data-test="conforma-violation-msg" />
      ) : (
        '-'
      )}
    </Content>
    {solution && <Content component="small">Solution: {solution}</Content>}
  </Content>
);

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
      {rows.map((row, idx) => (
        <Tr key={`${row.component}-${row.title}-${idx}`}>
          <Td dataLabel="Rule">
            <RuleCell title={row.title} code={row.code} description={row.description} />
          </Td>
          <Td dataLabel="Component">{row.component}</Td>
          <Td dataLabel="Image">
            <ImageCell images={row.images} />
          </Td>
          <Td dataLabel="Status">{getRuleStatus(row.status)}</Td>
          <Td dataLabel="Message">
            <MessageCell msg={row.msg} solution={row.solution} />
          </Td>
        </Tr>
      ))}
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
