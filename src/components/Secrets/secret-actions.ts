import { useModalLauncher } from '~/components/modal/ModalProvider';
import { secretDeleteModal } from '~/components/Secrets/secret-modal';
import { SecretModel } from '~/models';
import { Action } from '~/shared/components/action-menu/types';
import { SecretKind } from '~/types';
import { useAccessReviewForModel } from '~/utils/rbac';

export const useSecretActions = (secret: SecretKind): Action[] => {
  const showModal = useModalLauncher();
  const [canDelete] = useAccessReviewForModel(SecretModel, 'delete');
  return [
    {
      cta: () => showModal(secretDeleteModal(secret)),
      id: `delete-${secret.metadata.name.toLowerCase()}`,
      label: 'Delete',
      disabled: !canDelete,
      disabledTooltip: "You don't have access to delete this secret",
    },
  ];
};
