import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ButtonVariant,
  EmptyStateBody,
  Text,
  TextContent,
  TextVariants,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  EmptyStateActions,
  SearchInput,
} from '@patternfly/react-core';
import emptyStateImgUrl from '../../../assets/Integration-test.svg';
import { useIntegrationTestScenarios } from '../../../hooks/useIntegrationTestScenarios';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { Table } from '../../../shared';
import AppEmptyState from '../../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { IntegrationTestScenarioKind } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
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
  const { namespace, workspace } = useWorkspaceInfo();
  const [canCreateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'create',
  );

  const navigate = useNavigate();
  const [integrationTests, integrationTestsLoaded] = useIntegrationTestScenarios(
    namespace,
    workspace,
    applicationName,
  );
  const [nameFilter, setNameFilter] = useSearchParam('name', '');

  const filteredIntegrationTests = React.useMemo(
    () =>
      nameFilter
        ? integrationTests.filter((test) => test.metadata.name.indexOf(nameFilter) !== -1)
        : integrationTests,
    [nameFilter, integrationTests],
  );

  const handleAddTest = React.useCallback(() => {
    navigate(`/workspaces/${workspace}/applications/${applicationName}/integrationtests/add`);
  }, [navigate, applicationName, workspace]);

  const onClearFilters = () => setNameFilter('');
  const onNameInput = (name: string) => setNameFilter(name);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => setNameFilter('')} />;
  const NoDataEmptyMsg = () => (
    <IntegrationTestsEmptyState
      handleAddTest={handleAddTest}
      canCreateIntegrationTest={canCreateIntegrationTest}
    />
  );
  const DataToolbar = (
    <Toolbar data-test="component-list-toolbar" clearAllFilters={onClearFilters}>
      <ToolbarContent>
        <ToolbarGroup align={{ default: 'alignLeft' }}>
          <ToolbarItem>
            <SearchInput
              name="nameInput"
              data-test="name-input-filter"
              type="search"
              aria-label="name filter"
              placeholder="Filter by name..."
              onChange={(_event, name) => onNameInput(name)}
              value={nameFilter}
            />
          </ToolbarItem>
          <ToolbarItem>
            <ButtonWithAccessTooltip
              variant={ButtonVariant.secondary}
              onClick={handleAddTest}
              isDisabled={!canCreateIntegrationTest}
              tooltip="You don't have access to add an integration test"
              data-test="add-integration-test"
            >
              Add integration test
            </ButtonWithAccessTooltip>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );

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
