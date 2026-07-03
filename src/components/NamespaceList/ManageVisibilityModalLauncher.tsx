import { ModalVariant } from '@patternfly/react-core/deprecated';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import ManageVisibilityModal from '~/components/NamespaceList/ManageVisibilityModal';
import { NamespaceKind } from '~/types';

export const createManageVisibilityModalLauncher = (namespace: NamespaceKind) =>
  createModalLauncher(ManageVisibilityModal, {
    'data-test': 'manage-visibility-modal',
    variant: ModalVariant.small,
    title: 'Manage visibility',
  })({ namespace });
