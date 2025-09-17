import React from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { getErrorState } from '~/shared/utils/error-utils';
import { useIntegrationTestScenario } from '../../../hooks/useIntegrationTestScenarios';
import { IntegrationTestScenarioModel } from '../../../models';
import {
  INTEGRATION_TEST_DETAILS_PATH,
  INTEGRATION_TEST_EDIT_PATH,
  INTEGRATION_TEST_LIST_PATH,
} from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { useNamespace } from '../../../shared/providers/Namespace';
import { useApplicationBreadcrumbs } from '../../../utils/breadcrumb-utils';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { DetailsPage } from '../../DetailsPage';
import { useModalLauncher } from '../../modal/ModalProvider';
import { integrationTestDeleteModalAndNavigate } from '../IntegrationTestsListView/useIntegrationTestActions';

const IntegrationTestDetailsView: React.FC<React.PropsWithChildren> = () => {
  const namespace = useNamespace();
  const { integrationTestName, applicationName } = useParams<RouterParams>();

  const showModal = useModalLauncher();
  const navigate = useNavigate();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const [canUpdateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'update',
  );
  const [canDeleteIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'delete',
  );

  const [integrationTest, loaded, loadErr] = useIntegrationTestScenario(
    namespace,
    applicationName,
    integrationTestName,
  );

  if (loadErr) {
    return getErrorState(loadErr, loaded, 'integration test');
  }

  if (integrationTest?.metadata) {
    return (
      <DetailsPage
        headTitle={integrationTest.metadata.name}
        breadcrumbs={[
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
            name: integrationTest.metadata.name,
          },
        ]}
        title={
          <Text component={TextVariants.h2}>
            <b data-test="test-name">{integrationTest.metadata.name}</b>
          </Text>
        }
        actions={[
          {
            key: 'edit',
            label: 'Edit',
            component: (
              <Link
                to={INTEGRATION_TEST_EDIT_PATH.createPath({
                  applicationName,
                  integrationTestName,
                  workspaceName: namespace,
                })}
              >
                Edit
              </Link>
            ),
            isDisabled: !canUpdateIntegrationTest,
            disabledTooltip: "You don't have access to edit this integration test",
          },
          {
            onClick: () =>
              showModal<{ submitClicked: boolean }>(
                integrationTestDeleteModalAndNavigate(integrationTest),
              ).closed.then(({ submitClicked }) => {
                if (submitClicked)
                  navigate(
                    INTEGRATION_TEST_LIST_PATH.createPath({
                      applicationName,
                      workspaceName: namespace,
                    }),
                  );
              }),
            key: `delete-${integrationTest.metadata.name.toLowerCase()}`,
            label: 'Delete',
            isDisabled: !canDeleteIntegrationTest,
            disabledTooltip: "You don't have access to delete this integration test",
          },
        ]}
        tabs={[
          {
            key: '',
            label: 'Overview',
            isFilled: true,
          },
          {
            key: 'pipelineruns',
            label: 'Pipeline runs',
          },
        ]}
      />
    );
  }

  return (
    <Bullseye>
      <Spinner data-test="spinner" />
    </Bullseye>
  );
};

export default IntegrationTestDetailsView;
