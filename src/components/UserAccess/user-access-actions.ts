import { SpaceBindingRequestModel } from '../../models';
import { Action } from '../../shared/components/action-menu/types';
import { WorkspaceBinding } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { createRawModalLauncher } from '../modal/createModalLauncher';
import { useModalLauncher } from '../modal/ModalProvider';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';
import { RevokeAccessModal } from './RevokeAccessModal';

const revokeAccessModalLauncher = (username: string, sbr: WorkspaceBinding['bindingRequest']) =>
  createRawModalLauncher(RevokeAccessModal, {
    'data-test': 'revoke-access-modal',
    title: 'Revoke access?',
    titleIconVariant: 'warning',
  })({ username, sbr });

export const useSBRActions = (binding: WorkspaceBinding): Action[] => {
  const showModal = useModalLauncher();
  const { workspace } = useWorkspaceInfo();
  const [canUpdateSBR] = useAccessReviewForModel(SpaceBindingRequestModel, 'update');
  const [canDeleteSBR] = useAccessReviewForModel(SpaceBindingRequestModel, 'delete');
  const canUpdate = binding.bindingRequest && canUpdateSBR;
  const canDelete = binding.bindingRequest && canDeleteSBR;

  return [
    {
      label: 'Edit access',
      id: `edit-access-${binding.masterUserRecord}`,
      disabled: !canUpdate,
      disabledTooltip: "You don't have permission to edit access",
      cta: {
        href: `/workspaces/${workspace}/access/edit/${binding.masterUserRecord}`,
      },
    },
    {
      cta: () =>
        showModal(revokeAccessModalLauncher(binding.masterUserRecord, binding.bindingRequest)),
      id: `revoke-access-${binding.masterUserRecord}`,
      label: 'Revoke access',
      disabled: !canDelete,
      disabledTooltip: "You don't have permission to revoke access",
    },
  ];
};
