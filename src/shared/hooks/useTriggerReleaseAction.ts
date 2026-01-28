import { useNavigate } from 'react-router-dom';
import { ReleaseModel } from '../../models';
import { RELEASEPLAN_TRIGGER_PATH } from '../../routes/paths';
import { Snapshot } from '../../types/coreBuildService';
import { useAccessReviewForModel } from '../../utils/rbac';
import { useNamespace } from '../providers/Namespace';

type TriggerReleaseActionReturnType = {
  cta: () => void;
  isDisabled: boolean;
  disabledTooltip: string | null;
  key: string;
  label: string;
};

const getReleasePlanTriggerUrl = (workspaceName: string, snapshotName?: string): string => {
  if (!snapshotName) {
    return RELEASEPLAN_TRIGGER_PATH.createPath({
      workspaceName,
    });
  }

  return `${RELEASEPLAN_TRIGGER_PATH.createPath({
    workspaceName,
  })}?snapshot=${snapshotName}`;
};

const useTriggerReleaseAction = (snapshot?: Snapshot): TriggerReleaseActionReturnType => {
  const navigate = useNavigate();
  const namespace = useNamespace();
  const [canCreateRelease] = useAccessReviewForModel(ReleaseModel, 'create');

  return {
    cta: () => void navigate(getReleasePlanTriggerUrl(namespace, snapshot?.metadata?.name)),
    isDisabled: !canCreateRelease,
    disabledTooltip: canCreateRelease ? null : "You don't have access to trigger releases",
    key: 'trigger-release',
    label: 'Trigger release',
  };
};

export default useTriggerReleaseAction;
