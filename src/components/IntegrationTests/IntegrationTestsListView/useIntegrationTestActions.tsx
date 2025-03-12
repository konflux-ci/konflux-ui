import { INTEGRATION_TEST_EDIT_PATH } from '@routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { IntegrationTestScenarioModel } from '../../../models';
import { Action } from '../../../shared/components/action-menu/types';
import { IntegrationTestScenarioKind, ResolverType } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { createDeleteModalLauncher } from '../../modal/DeleteResourceModal';
import { useModalLauncher } from '../../modal/ModalProvider';

export const integrationTestDeleteModal = (integrationTestObj: IntegrationTestScenarioKind) =>
  createDeleteModalLauncher(integrationTestObj.kind)({
    obj: integrationTestObj,
    model: IntegrationTestScenarioModel,
    displayName: integrationTestObj.metadata.name,
  });

export const integrationTestDeleteModalAndNavigate = (
  integrationTestObj: IntegrationTestScenarioKind,
) =>
  createDeleteModalLauncher(integrationTestObj.kind)({
    obj: integrationTestObj,
    model: IntegrationTestScenarioModel,
    displayName: integrationTestObj.metadata.name,
    isEntryNotRequired: true,
  });

export const useIntegrationTestActions = (
  integrationTest: IntegrationTestScenarioKind,
): Action[] => {
  const showModal = useModalLauncher();
  const namespace = useNamespace();
  const [canUpdateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'update',
  );
  const [canDeleteIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'delete',
  );

  return [
    {
      id: `edit-${integrationTest.metadata.name.toLowerCase()}`,
      label: 'Edit',
      cta: {
        href: INTEGRATION_TEST_EDIT_PATH.createPath({
          workspaceName: namespace,
          applicationName: integrationTest.spec.application,
          integrationTestName: integrationTest.metadata.name,
        }),
      },
      disabled:
        !canUpdateIntegrationTest ||
        integrationTest.spec?.resolverRef?.resolver !== ResolverType.GIT,
      disabledTooltip:
        integrationTest.spec?.resolverRef?.resolver !== ResolverType.GIT && canUpdateIntegrationTest
          ? undefined
          : "You don't have access to edit this integration test",
      analytics: {
        link_name: 'edit-integration-test',
        link_location: 'integration-test-actions',
        integration_test_name: integrationTest.metadata.name,
        app_name: integrationTest.spec.application,
        namespace,
      },
    },
    {
      cta: () => showModal(integrationTestDeleteModal(integrationTest)),
      id: `delete-${integrationTest.metadata.name.toLowerCase()}`,
      label: 'Delete',
      disabled: !canDeleteIntegrationTest,
      disabledTooltip: "You don't have access to delete this integration test",
    },
  ];
};
