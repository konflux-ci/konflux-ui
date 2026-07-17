import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Content, Tooltip, Truncate as PfTruncate } from '@patternfly/react-core';
import { ExpandableRowContent, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { PIPELINE_RUNS_SECURITY_PATH } from '@routes/paths';
import { getRuleStatus } from '~/components/Conforma/utils';
import { Truncate } from '~/shared/components/truncate-text/Truncate';
import { useNamespace } from '~/shared/providers/Namespace';
import type { ConformaResultRow } from '~/types/conforma';
import type { GroupByMode, GroupedConformaRow } from './conforma-grouping-utils';
import { getCommonImageName } from './conforma-grouping-utils';
import { getConformaGroupedColumns } from './ConformaGroupedTableHeader';
import { ConformaResultsListRow } from './ConformaResultsListRow';
import './ConformaResultsTab.scss';

type ConformaGroupedTableProps = {
  groups: GroupedConformaRow[];
  groupBy: GroupByMode;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
};

const DetailSubTable: React.FC<{ rows: ConformaResultRow[] }> = ({ rows }) => {
  const namespace = useNamespace();
  const { applicationName } = useParams();
  return (
    <Table
      aria-label="Conforma detail rows"
      variant="compact"
      borders={false}
      className="conforma-results-tab__detail-table"
    >
      <Thead>
        <Tr>
          <Th width={20}>Rule</Th>
          <Th width={10}>Component</Th>
          <Th width={25}>Image</Th>
          <Th width={10}>Status</Th>
          <Th width={20}>Message</Th>
          <Th width={20}>Pipeline run</Th>
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
                      <Truncate
                        content={row.msg}
                        expandInline
                        data-test="conforma-violation-msg"
                      />
                    ) : (
                      '-'
                    )}
                  </Content>
                  {row.solution && <Content component="small">Solution: {row.solution}</Content>}
                </Content>
              </Td>
              <Td dataLabel="Pipeline run">
                {row.pipelineRunName ? (
                  <Link
                    to={PIPELINE_RUNS_SECURITY_PATH.createPath({
                      workspaceName: namespace,
                      applicationName: applicationName || '',
                      pipelineRunName: row.pipelineRunName,
                    })}
                    data-test="conforma-pipeline-run-link"
                  >
                    <PfTruncate content={row.pipelineRunName} />
                  </Link>
                ) : (
                  '-'
                )}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export const ConformaGroupedTable: React.FC<ConformaGroupedTableProps> = ({
  groups,
  groupBy,
  expandedGroups,
  onToggleGroup,
}) => {
  const groupLabel = groupBy === 'rule' ? 'Rule' : 'Component';
  const headerColumns = React.useMemo(() => getConformaGroupedColumns(groupLabel), [groupLabel]);

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
