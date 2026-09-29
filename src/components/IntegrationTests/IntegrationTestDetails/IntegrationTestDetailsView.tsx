import React from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Bullseye, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { useApplicationBreadcrumbs } from '~/components/Applications/breadcrumbs/breadcrumb-utils';
import { useComponentGroupBreadcrumbs } from '~/components/ComponentGroups/breadcrumb-utils';
import { DetailsPage } from '~/components/DetailsPage';
import { integrationTestDeleteModalAndNavigate } from '~/components/IntegrationTests/IntegrationTestsListView/useIntegrationTestActions';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { useIntegrationTestScenarioForContext } from '~/hooks/useIntegrationTestScenarios';
import { IntegrationTestScenarioModel } from '~/models';
import {
  GROUP_INTEGRATION_TEST_DETAILS_PATH,
  GROUP_INTEGRATION_TEST_LIST_PATH,
  INTEGRATION_TEST_DETAILS_PATH,
  INTEGRATION_TEST_EDIT_PATH,
  INTEGRATION_TEST_LIST_PATH,
} from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { useAccessReviewForModel } from '~/utils/rbac';

const IntegrationTestDetailsView: React.FC<React.PropsWithChildren> = () => {
  const namespace = useNamespace();
  const { integrationTestName, applicationName, groupName } = useParams<RouterParams>();
  const isGroupContext = Boolean(groupName);

  const showModal = useModalLauncher();
  const navigate = useNavigate();
  const [canUpdateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'update',
  );
  const [canDeleteIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'delete',
  );

  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const componentGroupBreadcrumbs = useComponentGroupBreadcrumbs(groupName);

  const [integrationTest, loaded, error] = useIntegrationTestScenarioForContext(
    namespace,
    integrationTestName ?? '',
    { applicationName, groupName },
  );

  const breadcrumbs = React.useMemo(
    () =>
      isGroupContext
        ? [
            ...componentGroupBreadcrumbs,
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
          ]
        : [
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
      isGroupContext,
      componentGroupBreadcrumbs,
      applicationBreadcrumbs,
      groupName,
      applicationName,
      integrationTest?.metadata?.name,
      integrationTestName,
      namespace,
    ],
  );

  const editPath = isGroupContext
    ? '#' // TODO
    : INTEGRATION_TEST_EDIT_PATH.createPath({
        applicationName,
        integrationTestName,
        workspaceName: namespace,
      });

  const listPath = isGroupContext
    ? GROUP_INTEGRATION_TEST_LIST_PATH.createPath({
        groupName,
        workspaceName: namespace,
      })
    : INTEGRATION_TEST_LIST_PATH.createPath({
        applicationName,
        workspaceName: namespace,
      });

  if (error) {
    return getErrorState(error, loaded, 'integration test');
  }

  if (integrationTest?.metadata) {
    return (
      <DetailsPage
        headTitle={integrationTest.metadata.name ?? ''}
        breadcrumbs={breadcrumbs}
        title={
          <Content component={ContentVariants.h2}>
            <b data-test="test-name">{integrationTest.metadata.name}</b>
          </Content>
        }
        actions={[
          {
            key: 'edit',
            label: 'Edit',
            component: <Link to={editPath}>Edit</Link>,
            isDisabled: !canUpdateIntegrationTest,
            disabledTooltip: "You don't have access to edit this integration test",
          },
          {
            onClick: () =>
              showModal<{ submitClicked: boolean }>(
                integrationTestDeleteModalAndNavigate(integrationTest),
              ).closed?.then(({ submitClicked }) => {
                if (submitClicked) navigate(listPath);
              }),
            key: `delete-${integrationTest.metadata?.name?.toLowerCase()}`,
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
          // Pipeline runs tab is only available in the application context for now
          ...(!isGroupContext
            ? [
                {
                  key: 'pipelineruns',
                  label: 'Pipeline runs',
                },
              ]
            : []),
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
