import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  AlertVariant,
  Bullseye,
  PageSection,
  PageSectionVariants,
  Spinner,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { getErrorState } from '~/shared/utils/error-utils';
import type { GroupByMode } from './conforma-grouping-utils';
import { filterResults, groupByComponent, groupByRule } from './conforma-grouping-utils';
import { ConformaGroupedTable } from './ConformaGroupedTable';
import { ConformaResultsToolbar } from './ConformaResultsToolbar';
import { ConformaSummaryBar } from './ConformaSummaryBar';
import { useApplicationConformaResults } from './useApplicationConformaResults';
import { useConformaFilters } from './useConformaFilters';
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
    partialLogError,
    refresh,
  } = useApplicationConformaResults(applicationName);

  const { name: nameFilter, status: statusFilter } = useConformaFilters();

  const [groupBy, setGroupBy] = React.useState<GroupByMode>('rule');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const handleGroupByChange = React.useCallback(
    (mode: GroupByMode) => {
      setGroupBy(mode);
      setExpandedGroups(new Set());
    },
    [],
  );

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

  const allExpanded =
    groups.length > 0 && groups.every((g) => expandedGroups.has(g.groupKey));

  const handleToggleExpandAll = React.useCallback(() => {
    setExpandedGroups((prev) => {
      const isAllExpanded =
        groups.length > 0 && groups.every((g) => prev.has(g.groupKey));
      return isAllExpanded
        ? new Set<string>()
        : new Set(groups.map((g) => g.groupKey));
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
      <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
        <TextContent>
          <Title headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-sm" size="lg">
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

      <PageSection isFilled padding={{ default: 'noPadding' }}>
        <ConformaResultsToolbar
          allResults={allResults}
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
          allExpanded={allExpanded}
          onToggleExpandAll={handleToggleExpandAll}
          refresh={refresh}
        />

        {partialLogError ? (
          <Alert
            data-test="conforma-partial-log-error"
            className="pf-v5-u-mt-md pf-v5-u-mx-lg"
            variant={AlertVariant.warning}
            isInline
            title="Some Conforma results could not be loaded"
          >
            {(partialLogError as { message?: string })?.message ??
              'One or more component log fetches failed. Results shown may be incomplete.'}
          </Alert>
        ) : null}

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
