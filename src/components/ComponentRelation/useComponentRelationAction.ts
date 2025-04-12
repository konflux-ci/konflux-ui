import { useAllComponents, useComponents } from '../../hooks/useComponents';
import { ComponentModel } from '../../models';
import { useNamespace } from '../../shared/providers/Namespace';
import { useAccessReviewForModel } from '../../utils/rbac';
import { useModalLauncher } from '../modal/ModalProvider';
import { createComponentRelationModal } from './ComponentRelationModal';

export const useComponentRelationAction = (application: string) => {
  const showModal = useModalLauncher();
  const namespace = useNamespace();
  const [components, loaded, error] = useComponents(namespace, application);
  const [canUpdateComponent] = useAccessReviewForModel(ComponentModel, 'patch');
  const [allComponents, allLoaded, allErrors] = useAllComponents(namespace);

  return () => ({
    key: 'component-relation-modal',
    label: 'Define component relationships',
    onClick: () => {
      showModal(createComponentRelationModal({ application }));
    },
    // The nudge feature supports for all components in the namespace.
    isDisabled:
      !canUpdateComponent ||
      (loaded && allLoaded && !error && !allErrors
        ? // For no component of the app or sigle component of the namespace,
          // the nudge feature should be disabled.
          components.length < 1 || allComponents.length < 2
        : null),
    disabledTooltip: !canUpdateComponent
      ? `You don't have access to define component relationships`
      : null,
  });
};
