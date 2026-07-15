import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  PageSection,
  Content,
  ContentVariants,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useDeepCompareMemoize } from '~/shared';
import { getErrorState } from '~/shared/utils/error-utils';
import type { GroupByMode } from './conforma-grouping-utils';
import {
  collapseArchDuplicates,
  countResultsByStatus,
  filterResults,
  groupByComponent,
  groupByRule,
} from './conforma-grouping-utils';
import { ConformaGroupedTable } from './ConformaGroupedTable';
import { ConformaResultsToolbar } from './ConformaResultsToolbar';
import { ConformaSummaryBar } from './ConformaSummaryBar';
import { useApplicationConformaResults } from './useApplicationConformaResults';
import './ConformaResultsTab.scss';

/**
 * Inner content component that reads filter state from FilterContext.
 * Separated so it can be a consumer within the FilterContextProvider that
 * ConformaResultsTab provides.
 */
const ConformaResultsTabContent: React.FC = () => {
  const { applicationName } = useParams();
  const { allResults, componentStatuses, totalComponents, totalFailed, loaded, error } =
    useApplicationConformaResults(applicationName);

  const { filters: unparsedFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });
  const { name: nameFilter, status: statusFilter } = filters;

  const [groupBy, setGroupBy] = React.useState<GroupByMode>('rule');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [showDuplicates, setShowDuplicates] = React.useState(false);

  const handleGroupByChange = React.useCallback((mode: GroupByMode) => {
    setGroupBy(mode);
    setExpandedGroups(new Set());
  }, []);

  const displayResults = React.useMemo(
    () => (showDuplicates ? allResults : collapseArchDuplicates(allResults)),
    [allResults, showDuplicates],
  );

  // Display counts drive the primary numbers shown (they match what the
  // table renders). Raw counts (always uncollapsed) are surfaced alongside
  // them so the summary bar never silently hides real violations/warnings/
  // successes that were merged away for display purposes.
  const displayCounts = React.useMemo(() => countResultsByStatus(displayResults), [displayResults]);
  const rawCounts = React.useMemo(() => countResultsByStatus(allResults), [allResults]);

  const filteredResults = React.useMemo(
    () => filterResults(displayResults, nameFilter, statusFilter),
    [displayResults, nameFilter, statusFilter],
  );

  const allComponentNames = React.useMemo(
    () => componentStatuses.map((c) => c.componentName),
    [componentStatuses],
  );

  const groups = React.useMemo(
    () =>
      groupBy === 'rule'
        ? groupByRule(filteredResults)
        : groupByComponent(filteredResults, allComponentNames),
    [groupBy, filteredResults, allComponentNames],
  );

  const handleToggleGroup = React.useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const allExpanded = groups.length > 0 && groups.every((g) => expandedGroups.has(g.groupKey));

  const handleToggleExpandAll = React.useCallback(() => {
    setExpandedGroups((prev) => {
      const isAllExpanded = groups.length > 0 && groups.every((g) => prev.has(g.groupKey));
      return isAllExpanded ? new Set<string>() : new Set(groups.map((g) => g.groupKey));
    });
  }, [groups]);

  const errorState = getErrorState(error, loaded, 'Conforma results');
  if (errorState) return errorState;

  if (!loaded) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner size="xl" aria-label="Loading Conforma results" />
        </Bullseye>
      </PageSection>
    );
  }

  const isEmpty = allResults.length === 0;

  return (
    <>
      <PageSection padding={{ default: 'noPadding' }}>
        <Content>
          <Title headingLevel="h3" className="pf-v6-c-title pf-v6-u-mt-lg pf-v6-u-mb-sm" size="lg">
            Conforma results summary
          </Title>
          <Content component={ContentVariants.p}>
            Conforma is a set of tools for verifying the provenance of application snapshots and
            validating them against a clearly defined policy.
          </Content>
        </Content>
        <div className="conforma-results-tab__summary-wrapper">
          <ConformaSummaryBar
            totalComponents={totalComponents}
            totalFailed={totalFailed}
            totalViolations={displayCounts.totalViolations}
            totalWarnings={displayCounts.totalWarnings}
            totalSuccesses={displayCounts.totalSuccesses}
            totalViolationsRaw={rawCounts.totalViolations}
            totalWarningsRaw={rawCounts.totalWarnings}
            totalSuccessesRaw={rawCounts.totalSuccesses}
          />
        </div>
      </PageSection>

      <PageSection isFilled padding={{ default: 'noPadding' }}>
        <ConformaResultsToolbar
          allResults={allResults}
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
          allExpanded={allExpanded}
          onToggleExpandAll={handleToggleExpandAll}
          showDuplicates={showDuplicates}
          onShowDuplicatesChange={setShowDuplicates}
        />

        {isEmpty ? (
          <Bullseye>
            <Content component={ContentVariants.p}>
              No Conforma results available for this application.
            </Content>
          </Bullseye>
        ) : groups.length === 0 ? (
          <Bullseye>
            <Content component={ContentVariants.p}>No results match the current filters.</Content>
          </Bullseye>
        ) : (
          <ConformaGroupedTable
            groups={groups}
            groupBy={groupBy}
            expandedGroups={expandedGroups}
            onToggleGroup={handleToggleGroup}
          />
        )}
      </PageSection>
    </>
  );
};

/**
 * Top-level tab component. Provides URL-synced FilterContext so that search
 * and status filters survive navigation and can be bookmarked, following the
 * same pattern used by CommitsListViewV2 and PipelineRunsListViewV2.
 */
export const ConformaResultsTab: React.FC = () => (
  <FilterContextProvider filterParams={['name', 'status']}>
    <ConformaResultsTabContent />
  </FilterContextProvider>
);
