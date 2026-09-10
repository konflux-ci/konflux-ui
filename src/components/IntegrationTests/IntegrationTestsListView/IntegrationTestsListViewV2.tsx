import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ButtonVariant, EmptyStateBody, Truncate, EmptyStateActions } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Integration-test.svg';
import { useIntegrationTestScenariosV2 } from '~/hooks/useIntegrationTestScenariosV2';
import { IntegrationTestScenarioModel } from '~/models';
import { RouterParams } from '~/routes/utils';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  useFilterState,
  useFilteredData,
  FilterToolbar,
} from '~/shared/components/Filter';
import ExternalLink from '~/shared/components/links/ExternalLink';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { Table, TableContainer, type ColumnDefinition } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { useAccessReviewForModel } from '~/utils/rbac';
import { textMatch } from '~/utils/text-filter-utils';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import { IntegrationTestLabels } from '../IntegrationTestForm/types';
import { ResolverRefParams, getURLForParam } from '../IntegrationTestForm/utils/create-utils';

const filterConfigs = defineFilters<IntegrationTestScenarioKind>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (item, value) => textMatch(item.metadata?.name, value),
  },
] as const);

const IntegrationTestsEmptyState: React.FC<
  React.PropsWithChildren<{
    handleAddTest: () => void;
    canCreateIntegrationTest: boolean;
  }>
> = ({ handleAddTest, canCreateIntegrationTest }) => {
  return (
    <AppEmptyState
      data-test="integration-tests__empty"
      emptyStateImg={emptyStateImgUrl}
      title="Test any code changes"
    >
      {/* TODO: we might want to update the text, since it mentions "application" */}
      <EmptyStateBody>
        Integration tests run in parallel, validating each new component build with the latest
        version of all other application components.
        <br />
        To add an integration test, link to a Git repository containing code that can test how your
        application components work together.
      </EmptyStateBody>
      <EmptyStateActions>
        <ButtonWithAccessTooltip
          variant={ButtonVariant.primary}
          onClick={handleAddTest}
          isDisabled={!canCreateIntegrationTest}
          tooltip="You don't have access to add an integration test"
          data-test="add-integration-test-empty"
        >
          Add integration test
        </ButtonWithAccessTooltip>
      </EmptyStateActions>
    </AppEmptyState>
  );
};

const IntegrationTestsListViewV2: React.FC<React.PropsWithChildren> = () => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [canCreateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'create',
  );

  const [integrationTests, integrationTestsLoaded, integrationTestsError] =
    useIntegrationTestScenariosV2(namespace, groupName);

  const { clientFilterValues, clearAll } = useFilterState(filterConfigs);
  const { filteredData } = useFilteredData(filterConfigs, integrationTests, clientFilterValues);

  const handleAddTest = React.useCallback(() => {
    // TODO: update to open page to add a ComponentGroup's IntegrationTestScenario page once implemented
    // eslint-disable-next-line no-alert
    alert('TODO');
  }, []);

  const columns: ColumnDefinition<IntegrationTestScenarioKind>[] = React.useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (obj) => obj.metadata?.name,
        cell: (info) => {
          const obj = info.row.original;
          return (
            // TODO: update route path to open ComponentGroup's IntegrationTestScenario
            // Details page once implemented
            // eslint-disable-next-line no-alert
            <Link to="#" data-test="integration-tests__row-name" onClick={() => alert('TODO')}>
              {obj.metadata?.name}
            </Link>
          );
        },
      },
      {
        id: 'gitUrl',
        header: 'Git URL',
        accessorFn: (obj) =>
          obj?.spec?.resolverRef?.params?.find((param) => param.name === ResolverRefParams.URL)
            ?.value ?? '-',
        cell: (info) => {
          const obj = info.row.original;
          if (!obj?.spec?.resolverRef?.params) return '-';
          return (
            <ExternalLink
              href={getURLForParam(obj.spec.resolverRef.params, ResolverRefParams.URL)}
              text={
                <Truncate
                  content={
                    obj.spec.resolverRef.params.find(
                      (param) => param.name === ResolverRefParams.URL,
                    )?.value || '-'
                  }
                />
              }
              stopPropagation
            />
          );
        },
      },
      {
        id: 'optionalForRelease',
        header: 'Optional for release',
        accessorFn: (obj) =>
          obj.metadata?.labels?.[IntegrationTestLabels.OPTIONAL] === 'true'
            ? 'Optional'
            : 'Mandatory',
      },
      {
        id: 'revision',
        header: 'Revision',
        accessorFn: (obj) =>
          obj?.spec?.resolverRef?.params?.find((param) => param.name === ResolverRefParams.REVISION)
            ?.value ?? '-',
        cell: (info) => {
          const obj = info.row.original;
          if (!obj?.spec?.resolverRef?.params) return '-';
          return (
            <ExternalLink
              href={getURLForParam(obj.spec.resolverRef.params, ResolverRefParams.REVISION)}
              text={
                obj.spec.resolverRef.params.find(
                  (param) => param.name === ResolverRefParams.REVISION,
                )?.value || '-'
              }
              stopPropagation
            />
          );
        },
      },
    ],
    [],
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
        unfilteredData={integrationTests}
        loaded={integrationTestsLoaded}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        noDataState={
          <IntegrationTestsEmptyState
            handleAddTest={handleAddTest}
            canCreateIntegrationTest={canCreateIntegrationTest}
          />
        }
        toolbar={
          <FilterToolbar configs={filterConfigs}>
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
          getRowId={(obj) => obj.metadata.uid ?? obj.metadata.name}
          aria-label="Integration tests"
        />
      </TableContainer>
    </ListLayout>
  );
};

export default IntegrationTestsListViewV2;
