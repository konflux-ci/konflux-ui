import { useNavigate } from 'react-router-dom';
import { SECRET_EDIT_PATH } from '@routes/paths';
import { SecretModel } from '../../models';
import { Action } from '../../shared/components/action-menu/types';
import { SecretKind } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { useModalLauncher } from '../modal/ModalProvider';
import { secretDeleteModal } from './secret-modal';

export const useSecretActions = (secret: SecretKind): Action[] => {
  const showModal = useModalLauncher();
  const [canDelete] = useAccessReviewForModel(SecretModel, 'delete');
  const [canEdit] = useAccessReviewForModel(SecretModel, 'patch');
  const navigate = useNavigate();
  return [
    {
      cta: () =>
        navigate(
          `${SECRET_EDIT_PATH.createPath({ workspaceName: secret.metadata.namespace })}?secret=${secret.metadata.name}`,
          { state: { secretData: secret } },
        ),
      id: `edit-${secret.metadata.name.toLowerCase()}`,
      label: 'Edit',
      disabled: !canEdit,
      disabledTooltip: "You don't have access to edit this secret",
    },
    {
      cta: () => showModal(secretDeleteModal(secret)),
      id: `delete-${secret.metadata.name.toLowerCase()}`,
      label: 'Delete',
      disabled: !canDelete,
      disabledTooltip: "You don't have access to delete this secret",
    },
  ];
};
