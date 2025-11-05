import * as React from 'react';
import { runStatus } from '~/consts/pipelinerun';
import { ReleaseCondition, ReleaseKind } from '~/types';

type RunStatusValue = (typeof runStatus)[keyof typeof runStatus];
export const getReleaseStatus = (release: ReleaseKind): RunStatusValue => {
  if (!release?.status?.conditions) {
    return runStatus.Unknown;
  }

  const releasedCondition = release.status.conditions.find(
    (c) => c.type === ReleaseCondition.Released,
  );
  if (!releasedCondition) {
    return runStatus.Pending;
  }

  const succeeded = releasedCondition.status === 'True' && releasedCondition.reason === 'Succeeded';
  if (succeeded) {
    return runStatus.Succeeded;
  }
  const progressing = releasedCondition.reason === 'Progressing';
  if (progressing) {
    return runStatus['In Progress'];
  }

  const failed = releasedCondition.reason === 'Failed' && releasedCondition.status === 'False';
  if (failed) {
    return runStatus.Failed;
  }

  return runStatus.Pending;
};

export const useReleaseStatus = (release: ReleaseKind) => {
  return React.useMemo(() => {
    return getReleaseStatus(release);
  }, [release]);
};
