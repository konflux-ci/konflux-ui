import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useIntegrationTestScenario } from '../../../hooks/useIntegrationTestScenarios';
import { RouterParams } from '../../../routes/utils';
import { useErrorState } from '../../../shared/hooks/useErrorState';
import { useNamespace } from '../../../shared/providers/Namespace';
import IntegrationTestView from './IntegrationTestView';

export const IntegrationTestEditForm: React.FC = () => {
  const { applicationName, integrationTestName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [integrationTest, loaded, error] = useIntegrationTestScenario(
    namespace,
    applicationName,
    integrationTestName,
  );
  const errorState = useErrorState(error, loaded, 'integration test');

  if (error) {
    return errorState;
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
