import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useIntegrationTestScenarioV2 } from '~/hooks/useIntegrationTestScenariosV2';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import IntegrationTestViewByGroup from './IntegrationTestViewByGroup';

const IntegrationTestEditFormByGroup: React.FC = () => {
  const { groupName, integrationTestName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [integrationTest, loaded, error] = useIntegrationTestScenarioV2(
    namespace,
    groupName ?? '',
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

  return <IntegrationTestViewByGroup integrationTest={integrationTest} />;
};

export default IntegrationTestEditFormByGroup;
