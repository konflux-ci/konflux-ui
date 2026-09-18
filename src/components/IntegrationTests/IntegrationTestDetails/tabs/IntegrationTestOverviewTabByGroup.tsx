import { useParams } from 'react-router-dom';
import { useIntegrationTestScenarioV2 } from '~/hooks/useIntegrationTestScenariosV2';
import { GROUP_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import IntegrationTestOverviewTab from './IntegrationTestOverviewTab';

export const IntegrationTestOverviewTabByGroup: React.FC = () => {
  const namespace = useNamespace();
  const { integrationTestName, groupName } = useParams<RouterParams>();

  const [integrationTest, loaded, error] = useIntegrationTestScenarioV2(
    namespace,
    groupName ?? '',
    integrationTestName ?? '',
  );

  return (
    <IntegrationTestOverviewTab
      integrationTest={integrationTest}
      loaded={loaded}
      error={error}
      contextTitle="Component Group"
      contextDetailsPath={GROUP_DETAILS_PATH.createPath({
        workspaceName: namespace,
        groupName,
      })}
      contextName={groupName ?? ''}
    />
  );
};

export default IntegrationTestOverviewTabByGroup;
