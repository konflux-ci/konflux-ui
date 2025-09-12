import { MonitoredReleaseKind, ReleaseCondition } from '~/types';
import { runStatus, conditionsRunStatus } from '~/utils/pipeline-utils';

export const monitoredReleaseStatus = (monitoredRelease: MonitoredReleaseKind): runStatus => {
  const conditions = monitoredRelease?.status?.conditions;
  if (!conditions?.length) return runStatus.Unknown;

  const releasedCondition = conditions.find((c) => c.type === ReleaseCondition.Released);
  if (!releasedCondition) {
    // If backend already uses 'Succeeded', delegate to the shared utility.
    return conditionsRunStatus(conditions);
  }

  const progressing = releasedCondition.reason === 'Progressing';
  if (progressing) {
    return runStatus['In Progress'];
  }

  // Transform only 'Released' → 'Succeeded' and preserve other conditions.
  const transformed = conditions.map((c) =>
    c.type === ReleaseCondition.Released ? { ...c, type: 'Succeeded' } : c,
  );
  return conditionsRunStatus(transformed);
};
