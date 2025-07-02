import { NamespaceKind } from '../../types';
import { createRawModalLauncher } from '../modal/createModalLauncher';
import ManageVisibilityModal from './ManageVisibilityModal';

export const createManageVisibilityModalLauncher = (namespace: NamespaceKind) => {
  const refreshKey = Date.now();
  return createRawModalLauncher(ManageVisibilityModal, {
    'data-test': 'manage-visibility-modal',
    hasNoBodyWrapper: true,
  })({ namespace, refreshKey });
};
