import { useComponents } from '../../hooks/useComponents';
import { ComponentModel } from '../../models';
import { useAccessReviewForModel } from '../../utils/rbac';
import { useModalLauncher } from '../modal/ModalProvider';
import { useWorkspaceInfo } from '../Workspace/workspace-context';
import { createComponentRelationModal } from './ComponentRelationModal';

export const useComponentRelationAction = (application: string) => {
  const showModal = useModalLauncher();
  const { namespace, workspace } = useWorkspaceInfo();
  const [components, loaded, error] = useComponents(namespace, workspace, application);
  const [canUpdateComponent] = useAccessReviewForModel(ComponentModel, 'patch');
  return () => ({
    key: 'component-relation-modal',
    label: 'Define component relationships',
    onClick: () => {
      showModal(createComponentRelationModal({ application }));
    },
    isDisabled: !canUpdateComponent || (loaded && !error ? components.length < 2 : null),
    disabledTooltip: !canUpdateComponent
      ? `You don't have access to define component relationships`
      : null,
  });
};
