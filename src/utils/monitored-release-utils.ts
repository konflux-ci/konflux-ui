import { MonitoredReleaseKind } from '../types';
import { conditionsRunStatus, runStatus } from './pipeline-utils';

export const monitoredReleaseStatus = (monitoredRelease: MonitoredReleaseKind): runStatus => {
  const conditions = monitoredRelease?.status?.conditions;
  if (!conditions?.length) {
    return runStatus.Pending;
  }

  // Find the 'Released' condition and create a modified conditions array
  // that conditionsRunStatus can work with (it expects 'Succeeded' type)
  const releasedCondition = conditions.find((c) => c.type === 'Released');
  if (!releasedCondition) {
    // If the dataset already uses 'Succeeded', reuse existing utility directly.
    return conditionsRunStatus(conditions);
  }

  // Transform only the 'Released' condition, preserving others (incl. reasons).
  const transformedConditions = conditions.map((c) =>
    c.type === 'Released' ? { ...c, type: 'Succeeded' } : c,
  );
  return conditionsRunStatus(transformedConditions);
};
