import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { runStatus } from '~/consts/pipelinerun';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { VulnerabilitiesTabContent } from '../../VulnerabilitiesTab/VulnerabilitiesTabContent';

export const PipelineRunVulnerabilitiesTab: React.FC = () => {
  const { pipelineRunName = '' } = useParams();
  const namespace = useNamespace();
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] = usePipelineRunV2(
    namespace,
    pipelineRunName,
  );
  const [taskRuns, taskRunsLoaded, taskRunError] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRunName,
    ROXCTL_SCAN_TASK,
  );
  const roxctlScanTaskRun = taskRuns[0];
  const isScanPending =
    !roxctlScanTaskRun &&
    pipelineRun &&
    [runStatus.Pending, runStatus.Running].includes(pipelineRunStatus(pipelineRun));

  if (!pipelineRunLoaded || !taskRunsLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (pipelineRunError) {
    return getErrorState(pipelineRunError, pipelineRunLoaded, 'pipeline run');
  }

  if (taskRunError) {
    return getErrorState(taskRunError, taskRunsLoaded, 'task runs');
  }

  return (
    <VulnerabilitiesTabContent
      taskRun={roxctlScanTaskRun}
      taskRunLoaded={taskRunsLoaded}
      context="pipelineRun"
      isScanPending={isScanPending}
    />
  );
};
