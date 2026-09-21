import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useIntegrationTestScenario } from '~/hooks/useIntegrationTestScenarios';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import IntegrationTestViewByApplication from './IntegrationTestViewByApplication';

const IntegrationTestEditFormByApplication: React.FC = () => {
  const { applicationName, integrationTestName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [integrationTest, loaded, error] = useIntegrationTestScenario(
    namespace,
    applicationName ?? '',
    integrationTestName ?? '',
  );

  if (error) {
    return getErrorState(error, loaded, 'integration test');
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  return <IntegrationTestViewByApplication integrationTest={integrationTest} />;
};

export default IntegrationTestEditFormByApplication;
