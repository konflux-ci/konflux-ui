import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  PageSection,
  PageSectionVariants,
  Spinner,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useDeepCompareMemoize } from '~/shared';
import type { GroupByMode } from './conforma-grouping-utils';
import { filterResults, groupByComponent, groupByRule } from './conforma-grouping-utils';
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
  const {
    allResults,
    componentStatuses,
    totalComponents,
    totalFailed,
    totalViolations,
    totalWarnings,
    totalSuccesses,
    loaded,
    error,
  } = useApplicationConformaResults(applicationName);

  const { filters: unparsedFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });
  const { name: nameFilter, status: statusFilter } = filters;

  const [groupBy, setGroupBy] = React.useState<GroupByMode>('rule');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const filteredResults = React.useMemo(
    () => filterResults(allResults, nameFilter, statusFilter),
    [allResults, nameFilter, statusFilter],
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

  const handleExpandAll = React.useCallback(() => {
    setExpandedGroups(new Set(groups.map((g) => g.groupKey)));
  }, [groups]);

  const handleCollapseAll = React.useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  if (error) {
    return (
      <PageSection>
        <Text>Unable to load Conforma results.</Text>
      </PageSection>
    );
  }

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
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Title headingLevel="h2" size="xl">
            Conforma results summary
          </Title>
          <Text component="p">
            Conforma is a set of tools for verifying the provenance of application snapshots and
            validating them against a clearly defined policy.
          </Text>
        </TextContent>
        <div className="conforma-results-tab__summary-wrapper">
          <ConformaSummaryBar
            totalComponents={totalComponents}
            totalFailed={totalFailed}
            totalViolations={totalViolations}
            totalWarnings={totalWarnings}
            totalSuccesses={totalSuccesses}
          />
        </div>
      </PageSection>

      <PageSection isFilled>
        <ConformaResultsToolbar
          allResults={allResults}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
        />

        {isEmpty ? (
          <Bullseye>
            <Text>No Conforma results available for this application.</Text>
          </Bullseye>
        ) : groups.length === 0 ? (
          <Bullseye>
            <Text>No results match the current filters.</Text>
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
