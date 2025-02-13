import * as React from 'react';
import { ComponentModel } from '../../models';
import { Action } from '../../shared/components/action-menu/types';
import { useNamespace } from '../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind } from '../../types';
import { startNewBuild } from '../../utils/component-utils';
import { useAccessReviewForModel } from '../../utils/rbac';
import { createCustomizeComponentPipelineModalLauncher } from '../CustomizedPipeline/CustomizePipelinesModal';
import { useModalLauncher } from '../modal/ModalProvider';
import { componentDeleteModal } from '../modal/resource-modals';

export const useComponentActions = (component: ComponentKind, name: string): Action[] => {
  const namespace = useNamespace();
  const showModal = useModalLauncher();
  const applicationName = component?.spec.application;
  const [canPatchComponent] = useAccessReviewForModel(ComponentModel, 'patch');
  const [canDeleteComponent] = useAccessReviewForModel(ComponentModel, 'delete');

  const actions: Action[] = React.useMemo(() => {
    if (!component) {
      return [];
    }
    const updatedActions: Action[] = [
      {
        cta: () =>
          showModal(
            createCustomizeComponentPipelineModalLauncher(
              component.metadata.name,
              component.metadata.namespace,
            ),
          ),
        id: 'manage-build-pipeline',
        label: 'Edit build pipeline plan',
        disabled: !canPatchComponent,
        disabledTooltip: "You don't have access to edit the build pipeline plan",
        analytics: {
          link_name: 'manage-build-pipeline',
          link_location: 'component-list',
          component_name: name,
          app_name: applicationName,
          namespace,
        },
      },
      {
        cta: () => startNewBuild(component),
        id: 'start-new-build',
        label: 'Start new build',
        disabled: !canPatchComponent,
        disabledTooltip: "You don't have access to start a new build",
        analytics: {
          link_name: 'start-new-build',
          link_location: 'component-actions',
          component_name: name,
          app_name: applicationName,
          namespace,
        },
      },
    ];

    updatedActions.push({
      cta: () => showModal(componentDeleteModal(component)),
      id: `delete-${name.toLowerCase()}`,
      label: 'Delete component',
      disabled: !canDeleteComponent,
      disabledTooltip: "You don't have access to delete a component",
    });
    return updatedActions;
  }, [
    applicationName,
    canDeleteComponent,
    canPatchComponent,
    component,
    name,
    showModal,
    namespace,
  ]);

  return actions;
};
