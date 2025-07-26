import * as React from 'react';
import { getUserDataFromLocalStorage } from '../../auth/utils';
import { k8sCreateResource } from '../../k8s/k8s-fetch';
import { RoleBindingModel, SelfSubjectAccessReviewModel } from '../../models';
import { Action } from '../../shared/components/action-menu/types';
import { NamespaceKind } from '../../types';
import { SelfSubjectAccessReviewKind } from '../../types/rbac';
import { useModalLauncher } from '../modal/ModalProvider';
import { createManageVisibilityModalLauncher } from './ManageVisibilityModalLauncher';

export const useNamespaceActions = (
  namespace: NamespaceKind,
): [Action[], boolean, (isOpen: boolean) => void] => {
  const showModal = useModalLauncher();
  const [isChecking, setChecking] = React.useState(false);
  const [canManage, setCanManage] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  const checkPermissions = React.useCallback(async () => {
    setChecking(true);
    const user = getUserDataFromLocalStorage();
    const resourceAttributes = {
      group: RoleBindingModel.apiGroup,
      resource: RoleBindingModel.plural,
      namespace: namespace.metadata.name,
    };
    try {
      const [createResponse, deleteResponse] = await Promise.all([
        k8sCreateResource({
          model: SelfSubjectAccessReviewModel,
          resource: {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            spec: {
              user: user.preferredUsername,
              group: ['system:authenticated'],
              resourceAttributes: { ...resourceAttributes, verb: 'create' },
            },
          },
        }),
        k8sCreateResource({
          model: SelfSubjectAccessReviewModel,
          resource: {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            spec: {
              user: user.preferredUsername,
              group: ['system:authenticated'],
              resourceAttributes: { ...resourceAttributes, verb: 'delete' },
            },
          },
        }),
      ]);
      setCanManage(
        (createResponse as SelfSubjectAccessReviewKind).status?.allowed &&
          (deleteResponse as SelfSubjectAccessReviewKind).status?.allowed,
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('SelfSubjectAccessReview failed:', e);
      setCanManage(true); // assume true on error
    }
    setChecking(false);
    setChecked(true);
  }, [namespace.metadata.name]);

  const onToggle = (isOpen: boolean) => {
    if (isOpen && !checked) {
      void checkPermissions();
    }
  };

  const actions: Action[] = React.useMemo(
    () => [
      {
        id: `manage-visibility-${namespace.metadata.name.toLowerCase()}`,
        label: 'Manage visibility',
        cta: () => {
          if (canManage) {
            showModal(createManageVisibilityModalLauncher(namespace));
          }
        },
        disabled: isChecking || (checked && !canManage),
        disabledTooltip: isChecking
          ? 'Checking permissions...'
          : "You don't have permission to manage namespace visibility",
      },
    ],
    [namespace, canManage, isChecking, checked, showModal],
  );

  return [actions, isChecking, onToggle];
};
