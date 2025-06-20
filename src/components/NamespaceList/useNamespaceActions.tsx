import { RoleBindingModel } from '../../models';
import { Action } from '../../shared/components/action-menu/types';
import { NamespaceKind } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { useModalLauncher } from '../modal/ModalProvider';
import { createManageVisibilityModalLauncher } from './ManageVisibilityModalLauncher';

export const useNamespaceActions = (namespace: NamespaceKind): Action[] => {
  const showModal = useModalLauncher();
  const [canCreateRB] = useAccessReviewForModel(RoleBindingModel, 'create');
  const [canDeleteRB] = useAccessReviewForModel(RoleBindingModel, 'delete');

  // User needs both create and delete permissions for RoleBindings to manage visibility
  const canManageVisibility = canCreateRB && canDeleteRB;

  return [
    {
      id: `manage-visibility-${namespace.metadata.name.toLowerCase()}`,
      label: 'Manage visibility',
      cta: () => {
        const modalLauncher = createManageVisibilityModalLauncher(namespace);
        showModal(modalLauncher);
      },
      disabled: !canManageVisibility,
      disabledTooltip: !canManageVisibility
        ? "You don't have permission to manage namespace visibility"
        : undefined,
    },
  ];
};
