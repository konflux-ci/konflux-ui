import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ComponentModel, ServiceAccountModel } from '../../models';
import { COMPONENT_LINKED_SECRETS_PATH, COMPONENT_LIST_PATH } from '../../routes/paths';
import { Action } from '../../shared/components/action-menu/types';
import { useNamespace } from '../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind } from '../../types';
import {
  GIT_PROVIDER_ANNOTATION,
  GIT_PROVIDER_ANNOTATION_VALUE,
  startNewBuild,
} from '../../utils/component-utils';
import { useAccessReviewForModel } from '../../utils/rbac';
import { createCustomizeComponentPipelineModalLauncher } from '../CustomizedPipeline/CustomizePipelinesModal';
import { useModalLauncher } from '../modal/ModalProvider';
import { componentDeleteModal } from '../modal/resource-modals';

export const getURLForComponentPR = (component: ComponentKind): string | undefined => {
  const gitProvider = component.metadata.annotations?.[GIT_PROVIDER_ANNOTATION];
  const url = component.spec.source?.git?.url?.replace(/\.git$/i, '');
  if (!url) return undefined;
  switch (gitProvider) {
    case GIT_PROVIDER_ANNOTATION_VALUE.GITHUB:
    case GIT_PROVIDER_ANNOTATION_VALUE.FORGEJO:
      return `${url}/pulls`;
    case GIT_PROVIDER_ANNOTATION_VALUE.GITLAB:
      return `${url}/-/merge_requests`;
    default:
      return undefined;
  }
};

export const useComponentActions = (component: ComponentKind, name: string): Action[] => {
  const namespace = useNamespace();
  const showModal = useModalLauncher();
  const navigate = useNavigate();
  const applicationName = component?.spec.application;
  const [canPatchComponent] = useAccessReviewForModel(ComponentModel, 'patch');
  const [canViewComponent] = useAccessReviewForModel(ComponentModel, 'get');
  const [canDeleteComponent] = useAccessReviewForModel(ComponentModel, 'delete');
  const [canManageLinkedSecrets] = useAccessReviewForModel(ServiceAccountModel, 'patch');
  const prURL = component ? getURLForComponentPR(component) : undefined;

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
      {
        cta: {
          href: COMPONENT_LINKED_SECRETS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            componentName: component.metadata.name,
          }),
        },
        id: `linked-secrets-${name.toLowerCase()}`,
        label: 'Manage linked secrets',
        disabled: !canManageLinkedSecrets,
        disabledTooltip: "You don't have access to manage linked secrets",
      },
      {
        cta: { href: prURL, external: true },
        id: `view-all-prs-${name.toLowerCase()}`,
        label: 'View all pull requests',
        disabled: !canViewComponent || !prURL,
        disabledTooltip: !prURL
          ? 'Pull request URL is not available for this component'
          : "You don't have access to view all pull requests",
        analytics: {
          link_name: 'view-all-prs',
          link_location: 'component-actions',
          component_name: name,
          app_name: applicationName,
          namespace,
        },
      },
    ];

    updatedActions.push({
      cta: () =>
        showModal(componentDeleteModal(component))?.closed?.then(({ submitClicked }) => {
          if (submitClicked)
            navigate(
              COMPONENT_LIST_PATH.createPath({
                applicationName,
                workspaceName: namespace,
              }),
            );
        }),
      id: `delete-${name.toLowerCase()}`,
      label: 'Delete component',
      disabled: !canDeleteComponent,
      disabledTooltip: "You don't have access to delete a component",
    });
    return updatedActions;
  }, [
    component,
    canPatchComponent,
    canViewComponent,
    name,
    applicationName,
    namespace,
    canManageLinkedSecrets,
    canDeleteComponent,
    prURL,
    showModal,
    navigate,
  ]);

  return actions;
};
