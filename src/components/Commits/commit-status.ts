import React from 'react';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsV2';
import { useNamespace } from '../../shared/providers/Namespace';
import { statuses } from '../../utils/commits-utils';
import { pipelineRunStatus } from '../../utils/pipeline-utils';

export const useCommitStatus = (
  application: string,
  commit: string,
): [string, boolean, unknown] => {
  const namespace = useNamespace();

  const [pipelineRuns, loaded, error] = usePipelineRunsForCommitV2(namespace, application, commit);

  const plrsForCommit = React.useMemo(
    () =>
      pipelineRuns?.sort(
        (a, b) => new Date(b.status?.startTime).getTime() - new Date(a.status?.startTime).getTime(),
      ),
    [pipelineRuns],
  );

  const commitStatus = React.useMemo(() => {
    if (!loaded || error) {
      return 'Pending';
    }

    const plrStatus = pipelineRunStatus(plrsForCommit?.[0]);
    if (statuses.includes(plrStatus)) {
      return plrStatus;
    }
    return 'Pending';
  }, [loaded, error, plrsForCommit]);

  return [commitStatus, loaded, error];
};
