import { MonitoredReleaseKind, Condition } from '../types';
import { runStatus, SucceedConditionReason } from './pipeline-utils';

export const conditionsMonitoredReleaseStatus = (conditions: Condition[]): runStatus => {
  if (!conditions?.length) {
    return runStatus.Pending;
  }

  const releasedCondition = conditions.find((c) => c.type === 'Released');

  if (!releasedCondition || !releasedCondition.status) {
    return runStatus.Pending;
  }

  const status =
    releasedCondition.status === 'True'
      ? runStatus.Succeeded
      : releasedCondition.status === 'False'
        ? runStatus.Failed
        : runStatus.Running;

  if (!releasedCondition.reason || releasedCondition.reason === status) {
    return status;
  }

  switch (releasedCondition.reason) {
    case SucceedConditionReason.PipelineRunStopped:
    case SucceedConditionReason.PipelineRunCancelled:
    case SucceedConditionReason.TaskRunCancelled:
    case SucceedConditionReason.Cancelled:
      return runStatus.Cancelled;
    case SucceedConditionReason.PipelineRunStopping:
    case SucceedConditionReason.TaskRunStopping:
      return runStatus.Failed;
    case SucceedConditionReason.CreateContainerConfigError:
    case SucceedConditionReason.ExceededNodeResources:
    case SucceedConditionReason.ExceededResourceQuota:
    case SucceedConditionReason.PipelineRunPending:
      return runStatus.Pending;
    case SucceedConditionReason.ConditionCheckFailed:
      return runStatus.Skipped;
    default:
      return status;
  }
};

export const monitoredReleaseStatus = (monitoredRelease: MonitoredReleaseKind): runStatus =>
  conditionsMonitoredReleaseStatus(monitoredRelease?.status?.conditions);
