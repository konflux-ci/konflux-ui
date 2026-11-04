import React from 'react';
import { PageSection } from '@patternfly/react-core';
import { ExpandedState } from '@tanstack/react-table';
import PageLayout from '~/components/PageLayout/PageLayout';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useComponentGroups } from '~/hooks/useComponentGroups';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  componentGroupsFilterConfig,
  componentGroupsTableColumns,
} from './component-groups-table-config';
import { ComponentGroupExpandedRow } from './ComponentGroupExpandedRow';
import ComponentGroupsEmptyState from './ComponentGroupsEmptyState';

export const ComponentGroupsListView: React.FC = () => {
  const namespace = useNamespace();
  const [groups, loaded, error] = useComponentGroups(namespace, true);
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(componentGroupsFilterConfig);

  const { filteredData } = useFilteredData(componentGroupsFilterConfig, groups, clientFilterValues);

  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const expanded = React.useMemo<ExpandedState>(() => {
    const state: Record<string, boolean> = {};
    expandedRows.forEach((key) => {
      state[key] = true;
    });
    return state;
  }, [expandedRows]);

  const handleExpandedChange = React.useCallback(
    (updaterOrValue: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(expanded) : updaterOrValue;
      setExpandedRows(
        next === true
          ? new Set(groups.map((group) => group.metadata?.name ?? '-'))
          : new Set(
              Object.entries(next)
                .filter(([, isExpanded]) => isExpanded)
                .map(([key]) => key),
            ),
      );
    },
    [expanded, groups],
  );

  if (error) {
    return getErrorState(error, loaded, 'component groups');
  }

  return (
    <PageLayout
      title={
        <>
          Groups
          <FeatureFlagIndicator flags={['component-model'] as const} />
        </>
      }
      description="One or more components or its branches can be grouped to form a component group"
    >
      <PageSection>
        <TableContainer
          data={filteredData}
          unfilteredData={groups}
          loaded={loaded}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={<ComponentGroupsEmptyState />}
          toolbar={
            isFiltered || groups.length > 0 ? (
              <FilterToolbar configs={componentGroupsFilterConfig} />
            ) : undefined
          }
        >
          <Table
            data={filteredData}
            columns={componentGroupsTableColumns}
            getRowId={(row) => row.metadata?.name ?? '-'}
            aria-label="Component groups list"
            enableSorting
            enableExpansion
            expanded={expanded}
            onExpandedChange={handleExpandedChange}
            expandedContent={(row) => (
              <ComponentGroupExpandedRow
                groupName={row.metadata?.name ?? ''}
                components={row.spec.components}
                namespace={namespace}
                allGroups={groups}
              />
            )}
          />
        </TableContainer>
      </PageSection>
    </PageLayout>
  );
};
