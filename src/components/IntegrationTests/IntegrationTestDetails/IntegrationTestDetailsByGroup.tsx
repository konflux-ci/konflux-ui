import React from 'react';
import { useParams } from 'react-router-dom';
import { useComponentGroupBreadcrumbs } from '~/components/ComponentGroups/breadcrumb-utils';
import { useIntegrationTestScenarioV2 } from '~/hooks/useIntegrationTestScenariosV2';
import {
  GROUP_INTEGRATION_TEST_DETAILS_PATH,
  GROUP_INTEGRATION_TEST_LIST_PATH,
} from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import IntegrationTestDetailsView from './IntegrationTestDetailsView';

const IntegrationTestDetailsByGroup: React.FC = () => {
  const namespace = useNamespace();
  const { integrationTestName, groupName } = useParams<RouterParams>();

  const componentGroupsBreadcrumbs = useComponentGroupBreadcrumbs();

  const [integrationTest, loaded, error] = useIntegrationTestScenarioV2(
    namespace,
    groupName ?? '',
    integrationTestName ?? '',
  );

  const breadcrumbs = React.useMemo(
    () => [
      ...componentGroupsBreadcrumbs,
      {
        path: GROUP_INTEGRATION_TEST_LIST_PATH.createPath({
          groupName,
          workspaceName: namespace,
        }),
        name: 'Integration tests',
      },
      {
        path: GROUP_INTEGRATION_TEST_DETAILS_PATH.createPath({
          groupName,
          integrationTestName,
          workspaceName: namespace,
        }),
        name: integrationTest?.metadata?.name ?? '',
      },
    ],
    [
      componentGroupsBreadcrumbs,
      groupName,
      integrationTest?.metadata?.name,
      integrationTestName,
      namespace,
    ],
  );

  return (
    <IntegrationTestDetailsView
      integrationTest={integrationTest}
      loaded={loaded}
      error={error}
      breadcrumbs={breadcrumbs}
      editPath="#" // TODO: will be implemented as part of https://redhat.atlassian.net/browse/KFLUXUI-1716
      listPath={GROUP_INTEGRATION_TEST_LIST_PATH.createPath({
        groupName,
        workspaceName: namespace,
      })}
    />
  );
};

export default IntegrationTestDetailsByGroup;
