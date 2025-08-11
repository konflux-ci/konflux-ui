import { NamespaceKind } from '~/types';
import { createModalLauncher } from '../modal/createModalLauncher';
import ManageVisibilityModal from './ManageVisibilityModal';

export const createManageVisibilityModalLauncher = (namespace: NamespaceKind) =>
  createModalLauncher(ManageVisibilityModal, {
    'data-test': 'manage-visibility-modal',
    variant: 'small',
    title: 'Manage visibility',
    description:
      'Manage visibility for a namespace. Private namespaces are only accessible to members, while public namespaces allow read-only access to all authenticated users.',
  })({ namespace });
