import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useIntegrationTestScenario } from '../../../hooks/useIntegrationTestScenarios';
import { HttpError } from '../../../k8s/error';
import { RouterParams } from '../../../routes/utils';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import { useWorkspaceInfo } from '../../Workspace/workspace-context';
import IntegrationTestView from './IntegrationTestView';

export const IntegrationTestEditForm: React.FC = () => {
  const { applicationName, integrationTestName } = useParams<RouterParams>();
  const { workspace, namespace } = useWorkspaceInfo();
  const [integrationTest, loaded, error] = useIntegrationTestScenario(
    namespace,
    workspace,
    applicationName,
    integrationTestName,
  );

  if (error) {
    const httpError = HttpError.fromCode((error as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode((error as { code: number }).code)}
        title={`Unable to load integration test ${integrationTestName}`}
        body={httpError.message}
      />
    );
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  return (
    <IntegrationTestView applicationName={applicationName} integrationTest={integrationTest} />
  );
};
