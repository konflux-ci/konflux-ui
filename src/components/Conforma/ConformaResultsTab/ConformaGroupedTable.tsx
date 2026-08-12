import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Content, Tooltip, Truncate as PfTruncate } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { type ExpandedState } from '@tanstack/react-table';
import { PIPELINE_RUNS_SECURITY_PATH } from '@routes/paths';
import { getRuleStatus } from '~/components/Conforma/utils';
import { Table as TableV2, type ColumnDefinition } from '~/shared/components/TableV2';
import { Truncate } from '~/shared/components/truncate-text/Truncate';
import { useNamespace } from '~/shared/providers/Namespace';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { ConformaResultRow } from '~/types/conforma';
import type { GroupByMode, GroupedConformaRow } from './conforma-grouping-utils';
import { getCommonImageName } from './conforma-grouping-utils';
import { ConformaCountBadge } from './ConformaCountBadge';
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
    <div className="conforma-results-tab__detail-table">
      <Table aria-label="Conforma detail rows" data-test="conforma-detail-table" variant="compact">
        <Thead>
          <Tr>
            <Th>Rule</Th>
            <Th>Component</Th>
            <Th>Image</Th>
            <Th>Status</Th>
            <Th>Message</Th>
            <Th>Pipeline run</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, idx) => {
            const { images } = row;
            const commonName = images.length > 1 ? getCommonImageName(images) : undefined;

            return (
              <Tr key={idx}>
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
                  {images.length > 1 ? (
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
                  ) : images.length === 1 ? (
                    <PfTruncate content={images[0]} />
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
    </div>
  );
};

export const ConformaGroupedTable: React.FC<ConformaGroupedTableProps> = ({
  groups,
  groupBy,
  expandedGroups,
  onToggleGroup,
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
      // Resolve the new state (handle both updater function and direct value)
      const newExpanded =
        typeof updaterOrValue === 'function' ? updaterOrValue(expanded) : updaterOrValue;

      // Find which row toggled by comparing old and new state
      const oldKeys = new Set(expandedGroups);
      // Handle ExpandedState: can be true (all expanded) or Record<string, boolean>
      const newExpandedRecord: Record<string, boolean> =
        newExpanded === true
          ? Object.fromEntries(groups.map((group) => [group.groupKey, true]))
          : newExpanded;
      const newKeys = new Set(
        Object.keys(newExpandedRecord).filter((key) => newExpandedRecord[key]),
      );

      // Find the difference
      oldKeys.forEach((key) => {
        if (!newKeys.has(key)) {
          onToggleGroup(key);
        }
      });
      newKeys.forEach((key) => {
        if (!oldKeys.has(key)) {
          onToggleGroup(key);
        }
      });
    },
    [expanded, expandedGroups, groups, onToggleGroup],
  );

  const columns = React.useMemo<ColumnDefinition<GroupedConformaRow>[]>(
    () => [
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
    ],
    [groupLabel],
  );

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
