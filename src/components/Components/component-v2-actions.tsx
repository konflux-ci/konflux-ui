import * as React from 'react';
import { ComponentModelV2, ServiceAccountModel } from '~/models';
import { COMPONENT_LINKED_SECRETS_V2_PATH } from '~/routes/paths';
import { Action } from '~/shared/components/action-menu/types';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { startNewBuildV2 } from '~/utils/component-utils';
import { useAccessReviewForModel } from '~/utils/rbac';
import { createStartNewBuildModalLauncher } from './StartNewBuildModal';

export const useComponentV2Actions = (componentName?: string, version?: string): Action[] => {
  const namespace = useNamespace();
  const showModal = useModalLauncher();
  const [canManageLinkedSecrets] = useAccessReviewForModel(ServiceAccountModel, 'patch');
  const [canStartBuild] = useAccessReviewForModel(ComponentModelV2, 'patch');

  return React.useMemo(() => {
    if (!componentName) {
      return [];
    }
    // with a version, start the build for that version directly; without one,
    // open the modal to pick versions
    const startNewBuild: Action = {
      cta: version
        ? () => startNewBuildV2(namespace, componentName, [version])
        : () => showModal(createStartNewBuildModalLauncher(componentName)),
      id: `start-new-build-${componentName.toLowerCase()}`,
      label: 'Start new build',
      disabled: !canStartBuild,
      disabledTooltip: "You don't have access to start a new build",
    };
    return [
      startNewBuild,
      {
        cta: {
          href: COMPONENT_LINKED_SECRETS_V2_PATH.createPath({
            workspaceName: namespace,
            componentName,
          }),
        },
        id: `linked-secrets-${componentName.toLowerCase()}`,
        label: 'Manage linked secrets',
        disabled: !canManageLinkedSecrets,
        disabledTooltip: "You don't have access to manage linked secrets",
      },
    ];
  }, [componentName, namespace, version, canStartBuild, canManageLinkedSecrets, showModal]);
};
