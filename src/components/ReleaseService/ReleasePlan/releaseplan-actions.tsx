import { ReleaseModel, ReleasePlanModel } from '../../../models';
import { RELEASEPLAN_EDIT_PATH, RELEASEPLAN_TRIGGER_PATH } from '../../../routes/paths';
import { useNamespace } from '../../../shared/providers/Namespace';
import { ReleasePlanKind } from '../../../types/coreBuildService';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { createDeleteModalLauncher } from '../../modal/DeleteResourceModal';
import { useModalLauncher } from '../../modal/ModalProvider';

export const useReleasePlanActions = (obj: ReleasePlanKind) => {
  const showModal = useModalLauncher();
  const namespace = useNamespace();
  const [canDelete] = useAccessReviewForModel(ReleasePlanModel, 'delete');
  const [canUpdate] = useAccessReviewForModel(ReleasePlanModel, 'update');
  const [canTrigger] = useAccessReviewForModel(ReleaseModel, 'create');

  return [
    {
      label: 'Trigger release plan',
      id: `trigger-releaseplan-${obj.metadata.name}`,
      cta: {
        href: `${RELEASEPLAN_TRIGGER_PATH.createPath({
          workspaceName: namespace,
        })}?releasePlan=${obj.metadata?.name}`,
      },
      disabled: !canTrigger,
      disabledTooltip: "You don't have permission to trigger this release plan",
    },
    {
      label: 'Edit release plan',
      id: `edit-releaseplan-${obj.metadata.name}`,
      disabled: !canUpdate,
      disabledTooltip: "You don't have permission to edit this release plan",
      cta: {
        href: RELEASEPLAN_EDIT_PATH.createPath({
          workspaceName: namespace,
          releasePlanName: obj.metadata?.name,
        }),
      },
    },
    {
      cta: () =>
        showModal(
          createDeleteModalLauncher(ReleasePlanModel.kind)({
            obj,
            model: ReleasePlanModel,
            displayName: obj.metadata.name,
          }),
        ),
      id: 'releaseplan-delete',
      label: 'Delete release plan',
      disabled: !canDelete,
      disabledTooltip: "You don't have permission to delete this release plan",
    },
  ];
};
