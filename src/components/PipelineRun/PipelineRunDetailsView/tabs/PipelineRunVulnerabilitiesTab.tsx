import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { findRoxctlScanTaskRun } from '../../VulnerabilitiesTab/roxctl-taskrun-utils';
import { VulnerabilitiesTabContent } from '../../VulnerabilitiesTab/VulnerabilitiesTabContent';

export const PipelineRunVulnerabilitiesTab: React.FC = () => {
  const { pipelineRunName = '' } = useParams();
  const namespace = useNamespace();
  const [taskRuns, taskRunsLoaded, taskRunError] = useTaskRunsForPipelineRuns(
    namespace,
    pipelineRunName,
  );
  const roxctlScanTaskRun = React.useMemo(() => findRoxctlScanTaskRun(taskRuns), [taskRuns]);

  if (!taskRunsLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (taskRunError) {
    return getErrorState(taskRunError, taskRunsLoaded, 'task runs');
  }

  return (
    <VulnerabilitiesTabContent
      taskRun={roxctlScanTaskRun}
      taskRunLoaded={taskRunsLoaded}
      context="pipelineRun"
    />
  );
};
