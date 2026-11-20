import * as React from 'react';
import { ModalVariant } from '@patternfly/react-core';
import ErrorModal from '~/components/modal/ErrorModal';
import { ComponentModelV2, ServiceAccountModel } from '~/models';
import { COMPONENT_LINKED_SECRETS_V2_PATH } from '~/routes/paths';
import { Action } from '~/shared/components/action-menu/types';
import { createModalLauncher } from '~/shared/components/modal/createModalLauncher';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { useNamespace } from '~/shared/providers/Namespace';
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
        ? () =>
            startNewBuildV2(namespace, componentName, [version]).catch((err) =>
              showModal(
                createModalLauncher(ErrorModal, {
                  'data-test': 'start-build-error-modal',
                  variant: ModalVariant.small,
                  title: 'Failed to start build',
                })({
                  errorMessage: err instanceof Error ? err.message : 'Failed to start build',
                }),
              ),
            )
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
