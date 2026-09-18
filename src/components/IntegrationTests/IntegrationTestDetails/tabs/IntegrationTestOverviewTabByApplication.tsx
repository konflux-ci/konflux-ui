import { useParams } from 'react-router-dom';
import { useIntegrationTestScenario } from '~/hooks/useIntegrationTestScenarios';
import { APPLICATION_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import IntegrationTestOverviewTab from './IntegrationTestOverviewTab';

export const IntegrationTestOverviewTabByApplication: React.FC = () => {
  const namespace = useNamespace();
  const { integrationTestName, applicationName } = useParams<RouterParams>();

  const [integrationTest, loaded, error] = useIntegrationTestScenario(
    namespace,
    applicationName ?? '',
    integrationTestName ?? '',
  );

  return (
    <IntegrationTestOverviewTab
      integrationTest={integrationTest}
      loaded={loaded}
      error={error}
      contextTitle="Application"
      contextDetailsPath={APPLICATION_DETAILS_PATH.createPath({
        workspaceName: namespace,
        applicationName: integrationTest?.spec.application,
      })}
      contextName={integrationTest?.spec.application}
    />
  );
};

export default IntegrationTestOverviewTabByApplication;
