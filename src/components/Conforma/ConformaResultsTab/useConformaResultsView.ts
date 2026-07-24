import * as React from 'react';
import { useFilterState, useFilteredData } from '~/shared/components/Filter';
import type { ExpandedState } from '~/shared/components/TableV2';
import type { ComponentConformaStatus, ConformaResultRow } from '~/types/conforma';
import type { GroupByMode } from './conforma-grouping-utils';
import {
  collapseArchDuplicates,
  countResultsByStatus,
  groupByComponent,
  groupByRule,
} from './conforma-grouping-utils';
import { filterConfigs, STATUS_FILTER_OPTIONS } from './conforma-table-config';

/**
 * Encapsulates the grouping/filtering/expansion state and derived data for the
 * Conforma results view, keeping `ConformaResultsTab` focused on rendering.
 */
export const useConformaResultsView = (
  allResults: ConformaResultRow[],
  componentStatuses: ComponentConformaStatus[],
) => {
  const { clientFilterValues, clearAll } = useFilterState(filterConfigs);

  const [groupBy, setGroupBy] = React.useState<GroupByMode>('rule');
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [showDuplicates, setShowDuplicates] = React.useState(false);

  const handleGroupByChange = React.useCallback((mode: GroupByMode) => {
    setGroupBy(mode);
    setExpanded({});
  }, []);

  const displayResults = React.useMemo(
    () => (showDuplicates ? allResults : collapseArchDuplicates(allResults)),
    [allResults, showDuplicates],
  );

  const displayCounts = React.useMemo(() => countResultsByStatus(displayResults), [displayResults]);
  const rawCounts = React.useMemo(() => countResultsByStatus(allResults), [allResults]);

  const statusOptions = React.useMemo(
    () =>
      STATUS_FILTER_OPTIONS.filter((option) => allResults.some((r) => r.status === option.value)),
    [allResults],
  );

  const { filteredData } = useFilteredData(filterConfigs, displayResults, clientFilterValues);

  const allComponentNames = React.useMemo(
    () => componentStatuses.map((c) => c.componentName),
    [componentStatuses],
  );

  const groups = React.useMemo(
    () =>
      groupBy === 'rule'
        ? groupByRule(filteredData)
        : groupByComponent(filteredData, allComponentNames),
    [groupBy, filteredData, allComponentNames],
  );

  const allExpanded =
    groups.length > 0 && (expanded === true || groups.every((g) => expanded[g.groupKey]));

  const handleToggleExpandAll = React.useCallback(() => {
    if (allExpanded) {
      setExpanded({});
    } else {
      const next: Record<string, boolean> = {};
      for (const g of groups) {
        next[g.groupKey] = true;
      }
      setExpanded(next);
    }
  }, [allExpanded, groups]);

  return {
    groupBy,
    handleGroupByChange,
    expanded,
    setExpanded,
    showDuplicates,
    setShowDuplicates,
    displayResults,
    displayCounts,
    rawCounts,
    statusOptions,
    filteredData,
    allComponentNames,
    groups,
    allExpanded,
    handleToggleExpandAll,
    clearAll,
  };
};
