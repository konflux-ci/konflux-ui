import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  Content,
  ContentVariants,
  PageSection,
  Spinner,
  Title,
} from '@patternfly/react-core';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { TableContainer, TableSkeleton } from '~/shared/components/TableV2';
import { getErrorState } from '~/shared/utils/error-utils';
import { ConformaGroupedTable } from './ConformaGroupedTable';
import { ConformaResultsToolbar } from './ConformaResultsToolbar';
import { ConformaSummaryBar } from './ConformaSummaryBar';
import { useApplicationConformaResults } from './useApplicationConformaResults';
import { useConformaResultsView } from './useConformaResultsView';
import './ConformaResultsTab.scss';

const ConformaResultsTabContent: React.FC = () => {
  const { applicationName } = useParams();
  const { allResults, componentStatuses, totalComponents, totalFailed, loaded, error } =
    useApplicationConformaResults(applicationName);

  const {
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
    groups,
    allExpanded,
    handleToggleExpandAll,
    clearAll,
  } = useConformaResultsView(allResults, componentStatuses);

  if (!loaded) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner size="xl" aria-label="Loading Conforma results" />
        </Bullseye>
      </PageSection>
    );
  }

  const errorState = getErrorState(error, loaded, 'Conforma results');
  if (errorState) {
    return errorState;
  }

  const toolbar = (
    <ConformaResultsToolbar
      statusOptions={statusOptions}
      groupBy={groupBy}
      onGroupByChange={handleGroupByChange}
      allExpanded={allExpanded}
      onToggleExpandAll={handleToggleExpandAll}
      showDuplicates={showDuplicates}
      onShowDuplicatesChange={setShowDuplicates}
    />
  );

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
        <TableContainer
          data={filteredData}
          unfilteredData={displayResults}
          loaded={loaded}
          toolbar={toolbar}
          skeleton={<TableSkeleton columns={4} />}
          noDataState={
            <Bullseye>
              <Content component={ContentVariants.p}>
                No Conforma results available for this application.
              </Content>
            </Bullseye>
          }
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        >
          <ConformaGroupedTable
            groups={groups}
            groupBy={groupBy}
            expanded={expanded}
            onExpandedChange={setExpanded}
          />
        </TableContainer>
      </PageSection>
    </>
  );
};

export const ConformaResultsTab: React.FC = () => <ConformaResultsTabContent />;
