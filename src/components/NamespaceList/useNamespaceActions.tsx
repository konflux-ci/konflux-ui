import { Action } from '../../shared/components/action-menu/types';
import { NamespaceKind } from '../../types';
import { useModalLauncher } from '../modal/ModalProvider';
import { createManageVisibilityModalLauncher } from './ManageVisibilityModalLauncher';

export const useNamespaceActions = (namespace: NamespaceKind): Action[] => {
  const showModal = useModalLauncher();

  return [
    {
      id: `manage-visibility-${namespace.metadata.name.toLowerCase()}`,
      label: 'Manage visibility',
      cta: () => {
        const modalLauncher = createManageVisibilityModalLauncher(namespace);
        showModal(modalLauncher);
      },
      disabled: false,
    },
  ];
};
