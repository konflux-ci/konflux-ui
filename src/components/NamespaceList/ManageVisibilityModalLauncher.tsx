import { ModalVariant } from '@patternfly/react-core';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import ManageVisibilityModal from '~/components/NamespaceList/ManageVisibilityModal';
import { NamespaceKind } from '~/types';

export const createManageVisibilityModalLauncher = (namespace: NamespaceKind) =>
  createModalLauncher(ManageVisibilityModal, {
    'data-test': 'manage-visibility-modal',
    variant: ModalVariant.small,
    title: 'Manage visibility',
    description:
      'Manage visibility for a namespace. Private namespaces are only accessible to members, while public namespaces allow read-only access to all authenticated users.',
  })({ namespace });
