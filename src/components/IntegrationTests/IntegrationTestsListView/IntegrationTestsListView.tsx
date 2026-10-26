import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ButtonVariant } from '@patternfly/react-core';
import { INTEGRATION_TEST_ADD_PATH } from '@routes/paths';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useFilterState, useFilteredData, FilterToolbar } from '~/shared/components/Filter';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { ColumnDefinition, Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { useIntegrationTestScenarios } from '../../../hooks/useIntegrationTestScenarios';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import {
  BASE_INTEGRATION_TESTS_COLUMNS,
  INTEGRATION_TESTS_ACTIONS_COLUMN,
  INTEGRATION_TESTS_LIST_COLUMN_STATE_KEY,
  INTEGRATION_TESTS_LIST_FILTERS,
} from './integration-tests-table-config';
import IntegrationTestsEmptyState from './IntegrationTestsEmptyState';

const columns: ColumnDefinition<IntegrationTestScenarioKind>[] = [
  ...BASE_INTEGRATION_TESTS_COLUMNS,
  INTEGRATION_TESTS_ACTIONS_COLUMN,
];

const IntegrationTestsListView: React.FC<React.PropsWithChildren> = () => {
  const { applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [canCreateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'create',
  );

  const navigate = useNavigate();
  const [integrationTests, integrationTestsLoaded, integrationTestsError] =
    useIntegrationTestScenarios(namespace, applicationName);

  const handleAddTest = React.useCallback(() => {
    navigate(INTEGRATION_TEST_ADD_PATH.createPath({ applicationName, workspaceName: namespace }));
  }, [navigate, applicationName, namespace]);

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
    <ListLayout
      title="Integration tests"
      description="Add an integration test to test all your components after you commit code."
    >
      <TableContainer
        data={filteredData}
        unfilteredData={integrationTests ?? []}
        loaded={integrationTestsLoaded}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        noDataState={
          <IntegrationTestsEmptyState
            handleAddTest={handleAddTest}
            canCreateIntegrationTest={canCreateIntegrationTest}
          />
        }
        toolbar={
          <FilterToolbar configs={INTEGRATION_TESTS_LIST_FILTERS}>
            <ColumnManagement<IntegrationTestScenarioKind>
              columns={columns}
              columnStateKey={INTEGRATION_TESTS_LIST_COLUMN_STATE_KEY}
              showColumnManagement
            />
            <ButtonWithAccessTooltip
              variant={ButtonVariant.secondary}
              onClick={handleAddTest}
              isDisabled={!canCreateIntegrationTest}
              tooltip="You don't have access to add an integration test"
              data-test="add-integration-test-toolbar"
            >
              Add integration test
            </ButtonWithAccessTooltip>
          </FilterToolbar>
        }
      >
        <Table
          data={filteredData}
          columns={columns}
          getRowId={(obj) => obj.metadata?.uid ?? obj.metadata?.name ?? ''}
          aria-label="Integration tests"
          columnStateKey={INTEGRATION_TESTS_LIST_COLUMN_STATE_KEY}
        />
      </TableContainer>
    </ListLayout>
  );
};

export default IntegrationTestsListView;
