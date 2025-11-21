import { ReleasePlanKind } from '../../../../types/coreBuildService';

enum ReleasePlanCondition {
  Matched = 'Matched',
}

export const isMatched = (releasePlan: ReleasePlanKind): boolean => {
  const matchedCondition = releasePlan.status?.conditions?.find(
    (c) => c.type === ReleasePlanCondition.Matched,
  );
  return matchedCondition?.status === 'True';
};
