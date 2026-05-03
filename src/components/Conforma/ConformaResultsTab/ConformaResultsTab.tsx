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
import type { GroupByMode } from './conforma-grouping-utils';
import { filterResults, groupByComponent, groupByRule } from './conforma-grouping-utils';
import { ConformaGroupedTable } from './ConformaGroupedTable';
import { ConformaResultsToolbar } from './ConformaResultsToolbar';
import { ConformaSummaryBar } from './ConformaSummaryBar';
import { useApplicationConformaResults } from './useApplicationConformaResults';

export const ConformaResultsTab: React.FC = () => {
  const { applicationName } = useParams();
  const {
    allResults,
    totalComponents,
    totalFailed,
    totalViolations,
    totalWarnings,
    totalSuccesses,
    loaded,
    error,
  } = useApplicationConformaResults(applicationName);

  const [searchText, setSearchText] = React.useState('');
  const [groupBy, setGroupBy] = React.useState<GroupByMode>('rule');
  const [statusFilters, setStatusFilters] = React.useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const filteredResults = React.useMemo(
    () => filterResults(allResults, searchText, statusFilters),
    [allResults, searchText, statusFilters],
  );

  const groups = React.useMemo(
    () => (groupBy === 'rule' ? groupByRule(filteredResults) : groupByComponent(filteredResults)),
    [groupBy, filteredResults],
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
        <div style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }}>
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
          searchText={searchText}
          onSearchChange={setSearchText}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          statusFilters={statusFilters}
          onStatusFiltersChange={setStatusFilters}
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
