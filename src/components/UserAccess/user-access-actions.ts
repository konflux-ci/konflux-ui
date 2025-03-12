import { USER_ACCESS_EDIT_PAGE } from '@routes/paths';
import { RoleBindingModel } from '../../models';
import { Action } from '../../shared/components/action-menu/types';
import { useNamespace } from '../../shared/providers/Namespace';
import { RoleBinding } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { createRawModalLauncher } from '../modal/createModalLauncher';
import { useModalLauncher } from '../modal/ModalProvider';
import { RevokeAccessModal } from './RevokeAccessModal';

const revokeAccessModalLauncher = (username: string, rb: RoleBinding) =>
  createRawModalLauncher(RevokeAccessModal, {
    'data-test': 'revoke-access-modal',
    title: 'Revoke access?',
    titleIconVariant: 'warning',
  })({ username, rb });

export const useRBActions = (binding: RoleBinding): Action[] => {
  const showModal = useModalLauncher();
  const namespace = useNamespace();
  const [canUpdateRB] = useAccessReviewForModel(RoleBindingModel, 'update');
  const [canDeleteRB] = useAccessReviewForModel(RoleBindingModel, 'delete');
  // Check if the user exists in the subjects array (subject kind is User)
  const userSubject = binding?.subjects?.find((subject) => subject?.kind === 'User');
  // Can update or delete based on permissions and user subject
  const canUpdate = userSubject && canUpdateRB;
  const canDelete = userSubject && canDeleteRB;

  return [
    {
      label: 'Edit access',
      id: `edit-access-${userSubject?.name}`,
      disabled: !canUpdate,
      disabledTooltip: "You don't have permission to edit access",
      cta: {
        href: USER_ACCESS_EDIT_PAGE.createPath({
          workspaceName: namespace,
          bindingName: userSubject?.name,
        }),
      },
    },
    {
      cta: () => showModal(revokeAccessModalLauncher(userSubject?.name, binding)),
      id: `revoke-access-${userSubject?.name}`,
      label: 'Revoke access',
      disabled: !canDelete,
      disabledTooltip: "You don't have permission to revoke access",
    },
  ];
};
