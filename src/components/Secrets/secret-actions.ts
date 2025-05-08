import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { SecretModel } from '../../models';
import { Action } from '../../shared/components/action-menu/types';
import { SecretKind } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { useModalLauncher } from '../modal/ModalProvider';
import { secretDeleteModal, secretDeleteModalForBuildServiceAccount } from './secret-modal';

export const useSecretActions = (secret: SecretKind): Action[] => {
  const showModal = useModalLauncher();
  const [canDelete] = useAccessReviewForModel(SecretModel, 'delete');
  const isNew = useIsOnFeatureFlag('buildServiceAccount');
  return [
    {
      cta: () =>
        showModal(
          !isNew ? secretDeleteModal(secret) : secretDeleteModalForBuildServiceAccount(secret),
        ),
      id: `delete-${secret.metadata.name.toLowerCase()}`,
      label: 'Delete',
      disabled: !canDelete,
      disabledTooltip: "You don't have access to delete this secret",
    },
  ];
};
