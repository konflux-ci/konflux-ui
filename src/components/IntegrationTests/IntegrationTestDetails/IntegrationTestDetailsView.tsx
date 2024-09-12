import React from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { useIntegrationTestScenario } from '../../../hooks/useIntegrationTestScenarios';
import { HttpError } from '../../../k8s/error';
import { IntegrationTestScenarioModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import { useApplicationBreadcrumbs } from '../../../utils/breadcrumb-utils';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { DetailsPage } from '../../DetailsPage';
import { useModalLauncher } from '../../modal/ModalProvider';
import { useWorkspaceInfo } from '../../Workspace/workspace-context';
import { integrationTestDeleteModalAndNavigate } from '../IntegrationTestsListView/useIntegrationTestActions';

const IntegrationTestDetailsView: React.FC<React.PropsWithChildren> = () => {
  const { namespace, workspace } = useWorkspaceInfo();
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
    workspace,
    applicationName,
    integrationTestName,
  );

  if (loadErr || (loaded && !integrationTest)) {
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode(loadErr ? (loadErr as { code: number }).code : 404)}
        title="Integration test not found"
        body="No such Integration test"
      />
    );
  }

  if (integrationTest?.metadata) {
    return (
      <DetailsPage
        headTitle={integrationTest.metadata.name}
        breadcrumbs={[
          ...applicationBreadcrumbs,
          {
            path: `/workspaces/${workspace}/applications/${applicationName}/integrationtests`,
            name: 'Integration tests',
          },
          {
            path: `/workspaces/${workspace}/applications/${applicationName}/integrationtests/${integrationTestName}`,
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
                to={`/workspaces/${workspace}/applications/${applicationName}/integrationtests/${integrationTestName}/edit`}
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
                    `/workspaces/${workspace}/applications/${applicationName}/integrationtests`,
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
