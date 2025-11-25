import React from 'react';
import { PipelineRunType } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { useNamespace } from '../../shared/providers/Namespace';
import { statuses } from '../../utils/commits-utils';
import { pipelineRunStatus } from '../../utils/pipeline-utils';

export const useCommitStatus = (
  application: string,
  commit: string,
): [string, boolean, unknown] => {
  const namespace = useNamespace();

  const [pipelineRuns, loaded, error] = usePipelineRunsForCommitV2(
    namespace,
    application,
    commit,
    1,
    undefined,
    PipelineRunType.BUILD,
  );

  const commitStatus = React.useMemo(() => {
    if (!loaded || error) {
      return 'Pending';
    }

    const plrStatus = pipelineRunStatus(pipelineRuns[0]);
    if (statuses.includes(plrStatus)) {
      return plrStatus;
    }
    return 'Pending';
  }, [loaded, error, pipelineRuns]);

  return [commitStatus, loaded, error];
};
