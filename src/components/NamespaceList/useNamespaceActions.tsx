import { RoleBindingModel } from '../../models';
import { Action } from '../../shared/components/action-menu/types';
import { NamespaceKind } from '../../types';
import { useAccessReview } from '../../utils/rbac';
import { useModalLauncher } from '../modal/ModalProvider';
import { createManageVisibilityModalLauncher } from './ManageVisibilityModalLauncher';

export const useNamespaceActions = (namespace: NamespaceKind): Action[] => {
  const showModal = useModalLauncher();

  // Check permissions for the specific target namespace
  const [canCreateRB, canCreateLoaded] = useAccessReview({
    group: RoleBindingModel.apiGroup,
    resource: RoleBindingModel.plural,
    namespace: namespace.metadata.name,
    verb: 'create',
  });

  const [canDeleteRB, canDeleteLoaded] = useAccessReview({
    group: RoleBindingModel.apiGroup,
    resource: RoleBindingModel.plural,
    namespace: namespace.metadata.name,
    verb: 'delete',
  });

  // User needs both create and delete permissions for RoleBindings to manage visibility
  const canManageVisibility = canCreateRB && canDeleteRB;
  const permissionsLoaded = canCreateLoaded && canDeleteLoaded;

  return [
    {
      id: `manage-visibility-${namespace.metadata.name.toLowerCase()}`,
      label: 'Manage visibility',
      cta: () => {
        const modalLauncher = createManageVisibilityModalLauncher(namespace);
        showModal(modalLauncher);
      },
      disabled: !permissionsLoaded || !canManageVisibility,
      disabledTooltip: !permissionsLoaded
        ? 'Loading permissions...'
        : !canManageVisibility
          ? "You don't have permission to manage namespace visibility"
          : undefined,
    },
  ];
};
