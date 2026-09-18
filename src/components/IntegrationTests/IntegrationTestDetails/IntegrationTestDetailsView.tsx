import React from 'react';
import { useNavigate, Link, To } from 'react-router-dom';
import { Bullseye, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { getErrorState } from '~/shared/utils/error-utils';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { IntegrationTestScenarioModel } from '../../../models';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { DetailsPage } from '../../DetailsPage';
import { useModalLauncher } from '../../modal/ModalProvider';
import { integrationTestDeleteModalAndNavigate } from '../IntegrationTestsListView/useIntegrationTestActions';

type IntegrationTestDetailsViewProps = {
  integrationTest: IntegrationTestScenarioKind | undefined | null;
  loaded: boolean;
  error: unknown;
  breadcrumbs: ({ name: string; path: string } | React.ReactElement)[];
  editPath: To;
  listPath: To;
};

const IntegrationTestDetailsView: React.FC<
  React.PropsWithChildren<IntegrationTestDetailsViewProps>
> = ({ integrationTest, loaded, error, breadcrumbs, editPath, listPath }) => {
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
