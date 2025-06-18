import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Bullseye,
  Spinner,
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
} from '@patternfly/react-core';
import { FilterContext } from '../../../components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '../../../components/Filter/toolbars/BaseTextFIlterToolbar';
import { useIntegrationTestScenarios } from '../../../hooks/useIntegrationTestScenarios';
import { useDeepCompareMemoize } from '../../../k8s/hooks/useK8sQueryWatch';
import { IntegrationTestScenarioModel } from '../../../models';
import { INTEGRATION_TEST_ADD_PATH } from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { Table } from '../../../shared';
import { useNamespace } from '../../../shared/providers/Namespace';
import { IntegrationTestScenarioKind } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import { IntegrationTestListHeader } from './IntegrationTestListHeader';
import IntegrationTestListRow from './IntegrationTestListRow';

const IntegrationTestsEmptyState: React.FC<
  React.PropsWithChildren<{
    applicationName: string;
  }>
> = ({ applicationName }) => (
  <EmptyState>
    <EmptyStateBody>
      No integration tests found for application <strong>{applicationName}</strong>.
    </EmptyStateBody>
    <EmptyStateActions>
      <Button variant="primary" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </EmptyStateActions>
  </EmptyState>
);

export const IntegrationTestsListView: React.FC = () => {
  const namespace = useNamespace();
  const { applicationName } = useParams<RouterParams>();
  const navigate = useNavigate();
  const [integrationTests, integrationTestsLoaded, error] = useIntegrationTestScenarios(
    namespace,
    applicationName,
  );
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });

  const { name } = filters;

  const filteredIntegrationTests = React.useMemo(
    () =>
      integrationTests.filter((test) => {
        if (name && !test.metadata.name.toLowerCase().includes(name.toLowerCase())) {
          return false;
        }
        return true;
      }),
    [integrationTests, name],
  );

  const canCreateIntegrationTest = useAccessReviewForModel(IntegrationTestScenarioModel, 'create');

  const handleAddTest = React.useCallback(() => {
    navigate(INTEGRATION_TEST_ADD_PATH.createPath({ applicationName, workspaceName: namespace }));
  }, [navigate, namespace, applicationName]);

  if (!integrationTestsLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyStateBody>{error as string}</EmptyStateBody>
        <EmptyStateActions>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </EmptyStateActions>
      </EmptyState>
    );
  }

  return (
    <>
      <BaseTextFilterToolbar
        text={name}
        label="name"
        setText={(value) => setFilters({ ...filters, name: value })}
        onClearFilters={() => onClearFilters()}
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
      {filteredIntegrationTests.length === 0 ? (
        <IntegrationTestsEmptyState applicationName={applicationName || ''} />
      ) : (
        <Table
          data={filteredIntegrationTests}
          aria-label="Integration tests"
          Header={IntegrationTestListHeader}
          Row={IntegrationTestListRow}
          loaded
          virtualize={false}
          getRowProps={(obj: IntegrationTestScenarioKind) => ({
            id: obj.metadata?.name,
          })}
        />
      )}
    </>
  );
};
