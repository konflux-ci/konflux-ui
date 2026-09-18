import React from 'react';
import { useParams } from 'react-router-dom';
import { useApplicationBreadcrumbs } from '~/components/Applications/breadcrumbs/breadcrumb-utils';
import { useIntegrationTestScenario } from '~/hooks/useIntegrationTestScenarios';
import {
  INTEGRATION_TEST_DETAILS_PATH,
  INTEGRATION_TEST_EDIT_PATH,
  INTEGRATION_TEST_LIST_PATH,
} from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import IntegrationTestDetailsView from './IntegrationTestDetailsView';

const IntegrationTestDetailsByApplication: React.FC = () => {
  const namespace = useNamespace();
  const { integrationTestName, applicationName } = useParams<RouterParams>();

  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [integrationTest, loaded, error] = useIntegrationTestScenario(
    namespace,
    applicationName ?? '',
    integrationTestName ?? '',
  );

  const breadcrumbs = React.useMemo(
    () => [
      ...applicationBreadcrumbs,
      {
        path: INTEGRATION_TEST_LIST_PATH.createPath({
          applicationName,
          workspaceName: namespace,
        }),
        name: 'Integration tests',
      },
      {
        path: INTEGRATION_TEST_DETAILS_PATH.createPath({
          applicationName,
          integrationTestName,
          workspaceName: namespace,
        }),
        name: integrationTest?.metadata?.name ?? '',
      },
    ],
    [
      applicationBreadcrumbs,
      applicationName,
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
      editPath={INTEGRATION_TEST_EDIT_PATH.createPath({
        applicationName,
        integrationTestName,
        workspaceName: namespace,
      })}
      listPath={INTEGRATION_TEST_LIST_PATH.createPath({
        applicationName,
        workspaceName: namespace,
      })}
    />
  );
};

export default IntegrationTestDetailsByApplication;
