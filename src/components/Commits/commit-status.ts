import React from 'react';
import { PipelineRunType, runStatus } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { PipelineRunKind } from '~/types';
import { useNamespace } from '../../shared/providers/Namespace';
import { statuses } from '../../utils/commits-utils';
import { pipelineRunStatus } from '../../utils/pipeline-utils';

export const getCommitStatusFromPipelineRuns = (pipelineRuns: PipelineRunKind[]): runStatus => {
  // Commit status is derived from pipeline runs in the following order:
  //   1. if any of the pipeline runs failed, the status is Failed
  //   2. if none failed but any are running/in progress, the status is Running/In Progress
  //   3. if all pipeline runs are successful, the status is Successful
  //   4. if none failed or running, but any are unknown/cancelled/pending, return that status

  const validStatuses = pipelineRuns
    .map((plr) => pipelineRunStatus(plr))
    .filter((status) => statuses.includes(status));

  if (validStatuses.length === 0) {
    return runStatus.Pending;
  }

  if (validStatuses.includes(runStatus.Failed)) {
    return runStatus.Failed;
  }

  const runningStatus = validStatuses.find(
    (status) => status === runStatus.Running || status === runStatus['In Progress'],
  );
  if (runningStatus) {
    return runningStatus;
  }

  if (validStatuses.every((status) => status === runStatus.Succeeded)) {
    return runStatus.Succeeded;
  }

  const otherStatus = validStatuses.find(
    (status) =>
      status === runStatus.Unknown ||
      status === runStatus.Cancelled ||
      status === runStatus.Pending,
  );
  if (otherStatus) {
    return otherStatus;
  }

  return runStatus.Pending;
};

export const useCommitStatus = (
  application: string,
  commit: string,
): [runStatus, boolean, unknown] => {
  const namespace = useNamespace();

  const [buildPipelineRuns, buildLoaded, buildError] = usePipelineRunsForCommitV2(
    namespace,
    application,
    commit,
    undefined,
    undefined,
    PipelineRunType.BUILD,
  );

  const [testPipelineRuns, testLoaded, testError] = usePipelineRunsForCommitV2(
    namespace,
    application,
    commit,
    undefined,
    undefined,
    PipelineRunType.TEST,
  );

  const loaded = buildLoaded && testLoaded;
  const error = buildError ?? testError;

  const commitStatus = React.useMemo(() => {
    if (!loaded || error) {
      return runStatus.Pending;
    }

    return getCommitStatusFromPipelineRuns([...testPipelineRuns, ...buildPipelineRuns]);
  }, [loaded, error, buildPipelineRuns, testPipelineRuns]);

  return [commitStatus, loaded, error];
};
