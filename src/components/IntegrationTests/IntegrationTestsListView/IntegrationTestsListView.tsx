import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ButtonVariant,
  EmptyStateBody,
  Text,
  TextContent,
  TextVariants,
  Title,
  EmptyStateActions,
} from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { getErrorState } from '~/shared/utils/error-utils';
import emptyStateImgUrl from '../../../assets/Integration-test.svg';
import { useIntegrationTestScenarios } from '../../../hooks/useIntegrationTestScenarios';
import { IntegrationTestScenarioModel } from '../../../models';
import { INTEGRATION_TEST_ADD_PATH } from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { Table, useDeepCompareMemoize } from '../../../shared';
import AppEmptyState from '../../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { IntegrationTestScenarioKind } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import { IntegrationTestListHeader } from './IntegrationTestListHeader';
import IntegrationTestListRow from './IntegrationTestListRow';

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
          data-test="add-integration-test"
        >
          Add integration test
        </ButtonWithAccessTooltip>
      </EmptyStateActions>
    </AppEmptyState>
  );
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
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const filteredIntegrationTests = React.useMemo(
    () =>
      nameFilter
        ? integrationTests.filter((test) => test.metadata.name.indexOf(nameFilter) !== -1)
        : integrationTests,
    [nameFilter, integrationTests],
  );

  const handleAddTest = React.useCallback(() => {
    navigate(INTEGRATION_TEST_ADD_PATH.createPath({ applicationName, workspaceName: namespace }));
  }, [navigate, applicationName, namespace]);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => (
    <IntegrationTestsEmptyState
      handleAddTest={handleAddTest}
      canCreateIntegrationTest={canCreateIntegrationTest}
    />
  );
  const DataToolbar = (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="name"
      setText={(name) => setFilters({ name })}
      onClearFilters={onClearFilters}
      dataTest="integration-list-toolbar"
    >
      <ButtonWithAccessTooltip
        variant={ButtonVariant.secondary}
        onClick={handleAddTest}
        isDisabled={!canCreateIntegrationTest}
        tooltip="You don't have access to add an integration test"
        data-test="add-integration-test"
      >
        Add integration test
      </ButtonWithAccessTooltip>
    </BaseTextFilterToolbar>
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
      <Table
        virtualize={false}
        data-test="integration-tests__table"
        data={filteredIntegrationTests}
        unfilteredData={integrationTests}
        aria-label="Integration tests"
        EmptyMsg={EmptyMsg}
        NoDataEmptyMsg={NoDataEmptyMsg}
        Toolbar={DataToolbar}
        Header={IntegrationTestListHeader}
        Row={IntegrationTestListRow}
        loaded={integrationTestsLoaded}
        getRowProps={(obj: IntegrationTestScenarioKind) => ({
          id: obj.metadata.name,
        })}
      />
    </>
  );
};

export default IntegrationTestsListView;
