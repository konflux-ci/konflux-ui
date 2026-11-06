import * as React from 'react';
import { ServiceAccountModel } from '~/models';
import { COMPONENT_LINKED_SECRETS_V2_PATH } from '~/routes/paths';
import { Action } from '~/shared/components/action-menu/types';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { useAccessReviewForModel } from '~/utils/rbac';

export const useComponentV2Actions = (componentName?: string): Action[] => {
  const namespace = useNamespace();
  const [canManageLinkedSecrets] = useAccessReviewForModel(ServiceAccountModel, 'patch');

  return React.useMemo(() => {
    if (!componentName) {
      return [];
    }
    return [
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
  }, [componentName, namespace, canManageLinkedSecrets]);
};
