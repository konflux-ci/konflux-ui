import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  AlertVariant,
  Bullseye,
  Flex,
  PageSection,
  Content,
  ContentVariants,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { RouterParams } from '~/routes/utils';
import { getErrorState } from '~/shared/utils/error-utils';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { GroupByMode } from './conforma-grouping-utils';
import {
  collapseArchDuplicates,
  countResultsByStatus,
  filterResults,
  filterUpcomingPolicyChanges,
  groupByComponent,
  groupByRule,
} from './conforma-grouping-utils';
import { ConformaGroupedTable } from './ConformaGroupedTable';
import { ConformaResultsToolbar } from './ConformaResultsToolbar';
import { ConformaSettlingAnnouncement } from './ConformaSettlingAnnouncement';
import { ConformaSummaryBar } from './ConformaSummaryBar';
import { useApplicationConformaResults } from './useApplicationConformaResults';
import { useConformaFilters } from './useConformaFilters';
import { usePolicyException } from './usePolicyException';
import './ConformaResultsTab.scss';

// URL query param used to persist the "show policy exceptions only" toggle so it
// can be shared/bookmarked. Kept as a constant so the FilterContext registration
// and the toggle handler stay in sync.
const POLICY_EXCEPTION_ONLY_PARAM = 'policy_exception_only';

/**
 * Inner content component that reads filter state from FilterContext.
 * Separated so it can be a consumer within the FilterContextProvider that
 * ConformaResultsTab provides.
 */

const ConformaResultsTabContent: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  const {
    allResults,
    componentStatuses,
    totalComponents,
    totalFailed,
    loaded,
    settling,
    error,
    partialLogError,
    refresh,
  } = useApplicationConformaResults(applicationName);

  const {
    name: nameFilter,
    status: statusFilter,
    component: componentFilter,
    policyExceptionOnly: showPolicyExceptionsOnly,
  } = useConformaFilters();

  // The policy-exceptions toggle is URL-synced (?policy_exception_only=true) via
  // FilterContext so it can be shared/bookmarked, matching the name/status/
  // component filters.
  const { setFilters } = React.useContext(FilterContext);

  const [groupBy, setGroupBy] = React.useState<GroupByMode>('rule');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [showDuplicates, setShowDuplicates] = React.useState(false);

  const handleGroupByChange = React.useCallback((mode: GroupByMode) => {
    setGroupBy(mode);
    setExpandedGroups(new Set());
  }, []);

  const handleShowPolicyExceptionsOnlyChange = React.useCallback(
    (checked: boolean) => {
      setFilters({
        name: nameFilter,
        component: componentFilter,
        // Policy exceptions are warnings, so enabling the toggle also ticks the
        // "warnings" status filter to keep the visible filters consistent.
        status:
          checked && !statusFilter.includes(CONFORMA_RESULT_STATUS.warnings)
            ? [...statusFilter, CONFORMA_RESULT_STATUS.warnings]
            : statusFilter,
        [POLICY_EXCEPTION_ONLY_PARAM]: checked,
      });
    },
    [setFilters, nameFilter, componentFilter, statusFilter],
  );

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

  const upcomingChanges = React.useMemo(
    () => filterUpcomingPolicyChanges(displayResults),
    [displayResults],
  );
  const upcomingChangesRaw = React.useMemo(
    () => filterUpcomingPolicyChanges(allResults),
    [allResults],
  );

  const filteredResults = React.useMemo(
    () => filterResults(displayResults, nameFilter, statusFilter, componentFilter),
    [displayResults, nameFilter, statusFilter, componentFilter],
  );

  // When the policy-exceptions toggle is on, restrict the table to only the
  // policy-exception warnings within the current filtered view.
  const policyExceptionResults = usePolicyException(filteredResults);
  const tableResults = showPolicyExceptionsOnly ? policyExceptionResults : filteredResults;

  const allComponentNames = React.useMemo(
    () => componentStatuses.map((c) => c.componentName),
    [componentStatuses],
  );

  const visibleComponentNames = React.useMemo(
    () =>
      componentFilter.length > 0
        ? allComponentNames.filter((name) => componentFilter.includes(name))
        : allComponentNames,
    [allComponentNames, componentFilter],
  );

  const groups = React.useMemo(
    () =>
      groupBy === 'rule'
        ? groupByRule(tableResults)
        : groupByComponent(tableResults, visibleComponentNames),
    [groupBy, tableResults, visibleComponentNames],
  );

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

  const isEmpty = allResults.length === 0 && !settling;

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
        <div
          className="conforma-results-tab__summary-wrapper"
          aria-busy={settling}
          data-test="conforma-results-summary-wrapper"
        >
          <ConformaSummaryBar
            totalComponents={totalComponents}
            totalFailed={totalFailed}
            totalViolations={displayCounts.totalViolations}
            totalWarnings={displayCounts.totalWarnings}
            totalSuccesses={displayCounts.totalSuccesses}
            totalViolationsRaw={rawCounts.totalViolations}
            totalWarningsRaw={rawCounts.totalWarnings}
            totalSuccessesRaw={rawCounts.totalSuccesses}
            upcomingChanges={upcomingChanges.length}
            upcomingChangesRaw={upcomingChangesRaw.length}
          />
          {settling ? (
            <Flex justifyContent={{ default: 'justifyContentCenter' }}>
              <Spinner size="md" aria-label="Updating summary" />
            </Flex>
          ) : null}
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
          showPolicyExceptionsOnly={showPolicyExceptionsOnly}
          onShowPolicyExceptionsOnlyChange={handleShowPolicyExceptionsOnlyChange}
          refresh={refresh}
        />

        {partialLogError ? (
          <Alert
            data-test="conforma-partial-log-error"
            className="pf-v6-u-mt-md pf-v6-u-mx-lg"
            variant={AlertVariant.warning}
            isInline
            title="Some Conforma results could not be loaded"
          >
            {partialLogError instanceof Error && partialLogError.message
              ? partialLogError.message
              : 'One or more component log fetches failed. Results shown may be incomplete.'}
          </Alert>
        ) : null}

        {isEmpty ? (
          <Bullseye>
            <Content component={ContentVariants.p}>
              No Conforma results available for this application.
            </Content>
          </Bullseye>
        ) : groups.length === 0 ? (
          settling ? null : (
            <Bullseye>
              <Content component={ContentVariants.p}>No results match the current filters.</Content>
            </Bullseye>
          )
        ) : (
          <ConformaGroupedTable
            groups={groups}
            groupBy={groupBy}
            expandedGroups={expandedGroups}
            onExpandedGroupsChange={setExpandedGroups}
          />
        )}
      </PageSection>

      <ConformaSettlingAnnouncement settling={settling} />
    </>
  );
};

/**
 * Top-level tab component. Provides URL-synced FilterContext so that search
 * and status filters survive navigation and can be bookmarked, following the
 * same pattern used by CommitsListViewV2 and PipelineRunsListViewV2.
 */
export const ConformaResultsTab: React.FC = () => (
  <FilterContextProvider
    filterParams={['name', 'status', 'component', POLICY_EXCEPTION_ONLY_PARAM]}
  >
    <ConformaResultsTabContent />
  </FilterContextProvider>
);
