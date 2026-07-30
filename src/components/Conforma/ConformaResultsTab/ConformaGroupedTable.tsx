import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Content, Tooltip, Truncate as PfTruncate } from '@patternfly/react-core';
import { type ExpandedState } from '@tanstack/react-table';
import { PIPELINE_RUNS_SECURITY_PATH } from '@routes/paths';
import { getRuleStatus } from '~/components/Conforma/utils';
import { Table, type ColumnDefinition } from '~/shared/components/TableV2';
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

  const detailColumns = React.useMemo<ColumnDefinition<ConformaResultRow>[]>(
    () => [
      {
        id: 'rule',
        header: 'Rule',
        cell: ({ row }) => (
          <Content>
            <Content component="p">
              <strong>{row.original.title ?? '-'}</strong>
            </Content>
            {row.original.code && <Content component="small">{row.original.code}</Content>}
            {row.original.description && (
              <Content component="small">{row.original.description}</Content>
            )}
          </Content>
        ),
      },
      {
        id: 'component',
        header: 'Component',
        cell: ({ row }) => row.original.component,
      },
      {
        id: 'image',
        header: 'Image',
        cell: ({ row }) => {
          const { images } = row.original;
          const commonName = images.length > 1 ? getCommonImageName(images) : undefined;

          if (images.length > 1) {
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

          return images.length === 1 ? <PfTruncate content={images[0]} /> : '-';
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => getRuleStatus(row.original.status),
      },
      {
        id: 'message',
        header: 'Message',
        cell: ({ row }) => (
          <Content>
            <Content component="p">
              {row.original.msg != null ? (
                <Truncate
                  content={row.original.msg}
                  expandInline
                  data-test="conforma-violation-msg"
                />
              ) : (
                '-'
              )}
            </Content>
            {row.original.solution && (
              <Content component="small">Solution: {row.original.solution}</Content>
            )}
          </Content>
        ),
      },
      {
        id: 'pipelineRun',
        header: 'Pipeline run',
        cell: ({ row }) =>
          row.original.pipelineRunName ? (
            <Link
              to={PIPELINE_RUNS_SECURITY_PATH.createPath({
                workspaceName: namespace,
                applicationName: applicationName || '',
                pipelineRunName: row.original.pipelineRunName,
              })}
              data-test="conforma-pipeline-run-link"
            >
              <PfTruncate content={row.original.pipelineRunName} />
            </Link>
          ) : (
            '-'
          ),
      },
    ],
    [namespace, applicationName],
  );

  return (
    <div className="conforma-results-tab__detail-table">
      <Table
        data={rows}
        columns={detailColumns}
        getRowId={(row) => `${row.component}-${row.title}-${row.images[0] || ''}`}
        aria-label="Conforma detail rows"
        data-test="conforma-detail-table"
      />
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
    <Table
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
