import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ButtonVariant,
  EmptyStateBody,
  Text,
  TextContent,
  TextVariants,
  Title,
  Truncate,
  EmptyStateActions,
} from '@patternfly/react-core';
import { INTEGRATION_TEST_ADD_PATH, INTEGRATION_TEST_DETAILS_PATH } from '@routes/paths';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  useFilterState,
  useFilteredData,
  FilterToolbar,
} from '~/shared/components/Filter';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { Table, TableContainer, type ColumnDefinition } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { textMatch } from '~/utils/text-filter-utils';
import emptyStateImgUrl from '../../../assets/Integration-test.svg';
import { useIntegrationTestScenarios } from '../../../hooks/useIntegrationTestScenarios';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { IntegrationTestScenarioKind } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import { IntegrationTestLabels } from '../IntegrationTestForm/types';
import { ResolverRefParams, getURLForParam } from '../IntegrationTestForm/utils/create-utils';
import { useIntegrationTestActions } from './useIntegrationTestActions';

const filterConfigs = defineFilters<IntegrationTestScenarioKind>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (item, value) => textMatch(item.metadata.name, value),
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

const IntegrationTestActionCell: React.FC<{ obj: IntegrationTestScenarioKind }> = ({ obj }) => {
  const actions = useIntegrationTestActions(obj);
  return <ActionMenu actions={actions} />;
};

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

  const { clientFilterValues, clearAll } = useFilterState(filterConfigs);
  const { filteredData } = useFilteredData(filterConfigs, integrationTests, clientFilterValues);

  const handleAddTest = React.useCallback(() => {
    navigate(INTEGRATION_TEST_ADD_PATH.createPath({ applicationName, workspaceName: namespace }));
  }, [navigate, applicationName, namespace]);

  const columns: ColumnDefinition<IntegrationTestScenarioKind>[] = React.useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (obj) => obj.metadata.name,
        cell: (info) => {
          const obj = info.row.original;
          return (
            <Link
              to={INTEGRATION_TEST_DETAILS_PATH.createPath({
                applicationName: obj.spec?.application,
                integrationTestName: obj.metadata?.name,
                workspaceName: namespace,
              })}
              data-test="integration-tests__row-name"
            >
              {obj.metadata.name}
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
          obj.metadata.labels?.[IntegrationTestLabels.OPTIONAL] === 'true'
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
      {
        id: 'actions',
        header: ' ',
        accessorFn: () => null,
        cell: (info) => <IntegrationTestActionCell obj={info.row.original} />,
      },
    ],
    [namespace],
  );

  if (integrationTestsError) {
    return getErrorState(integrationTestsError, integrationTestsLoaded, 'integration tests');
  }

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-u-mt-lg pf-v5-u-mb-sm">
        Integration tests
      </Title>
      <TextContent>
        <Text component={TextVariants.p}>
          Add an integration test to test all your components after you commit code.
        </Text>
      </TextContent>
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
    </>
  );
};

export default IntegrationTestsListView;
