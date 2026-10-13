import * as React from 'react';
import { useParams } from 'react-router-dom';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import {
  BASE_INTEGRATION_TESTS_COLUMNS,
  INTEGRATION_TESTS_LIST_FILTERS,
} from '~/components/IntegrationTests/IntegrationTestsListView/integration-tests-table-config';
import IntegrationTestsEmptyState from '~/components/IntegrationTests/IntegrationTestsListView/IntegrationTestsEmptyState';
import { IfFeature } from '~/feature-flags/hooks';
import { useIntegrationTestScenariosByComponentGroup } from '~/hooks/useIntegrationTestScenarios';
import { RouterParams } from '~/routes/utils';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useFilterState, useFilteredData, FilterToolbar } from '~/shared/components/Filter';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';

const COMPONENT_GROUP_INTEGRATION_TESTS_LIST_COLUMN_STATE_KEY =
  'component-group-integration-tests-list';

export const ComponentGroupIntegrationTestsTab: React.FC = () => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const [integrationTests, integrationTestsLoaded, integrationTestsError] =
    useIntegrationTestScenariosByComponentGroup(namespace, groupName);

  const { clientFilterValues, clearAll } = useFilterState(INTEGRATION_TESTS_LIST_FILTERS);
  const { filteredData } = useFilteredData(
    INTEGRATION_TESTS_LIST_FILTERS,
    integrationTests ?? [],
    clientFilterValues,
  );

  if (integrationTestsError) {
    return getErrorState(integrationTestsError, integrationTestsLoaded, 'integration tests');
  }

  return (
    <IfFeature flag="component-model">
      <ListLayout
        title="Integration tests"
        description="Add an integration test to test all your components after you commit code."
      >
        <TableContainer
          data={filteredData}
          unfilteredData={integrationTests ?? []}
          loaded={integrationTestsLoaded}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={<IntegrationTestsEmptyState context="componentGroup" />}
          toolbar={
            <FilterToolbar configs={INTEGRATION_TESTS_LIST_FILTERS}>
              <ColumnManagement<IntegrationTestScenarioKind>
                columns={BASE_INTEGRATION_TESTS_COLUMNS}
                columnStateKey={COMPONENT_GROUP_INTEGRATION_TESTS_LIST_COLUMN_STATE_KEY}
                showColumnManagement
              />
            </FilterToolbar>
          }
        >
          <Table
            data={filteredData}
            columns={BASE_INTEGRATION_TESTS_COLUMNS}
            getRowId={(obj) => obj.metadata?.uid ?? obj.metadata?.name ?? ''}
            aria-label="Integration tests"
            columnStateKey={COMPONENT_GROUP_INTEGRATION_TESTS_LIST_COLUMN_STATE_KEY}
          />
        </TableContainer>
      </ListLayout>
    </IfFeature>
  );
};

export default ComponentGroupIntegrationTestsTab;
