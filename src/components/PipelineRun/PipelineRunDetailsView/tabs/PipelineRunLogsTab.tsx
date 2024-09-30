import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { usePipelineRun } from '../../../../hooks/usePipelineRuns';
import { useSearchParam } from '../../../../hooks/useSearchParam';
// import { PipelineRunLogs } from '../../../shared';
import { useTaskRuns } from '../../../../hooks/useTaskRuns';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
import { useWorkspaceInfo } from '../../../Workspace/workspace-context';

// [TODO]
// eslint-disable-next-line
const PipelineRunLogs: React.FC<any> = () => <div> Logs Tab </div>;

const PipelineRunLogsTab: React.FC = () => {
  const { pipelineRunName, workspaceName: workspace } = useParams<RouterParams>();
  const { namespace } = useWorkspaceInfo();
  const [pipelineRun, loaded, error] = usePipelineRun(namespace, pipelineRunName);
  const [taskRuns, taskRunsLoaded, taskRunError] = useTaskRuns(namespace, pipelineRunName);
  const [activeTask, setActiveTask, unSetActiveTask] = useSearchParam('task', undefined);

  const handleActiveTaskChange = React.useCallback(
    (value: string | undefined) => {
      value ? setActiveTask(value) : unSetActiveTask();
    },
    [setActiveTask, unSetActiveTask],
  );

  const loadError = error || taskRunError;
  if (loadError) {
    const httpError = HttpError.fromCode((loadError as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load pipeline run ${pipelineRunName}`}
        body={httpError.message}
      />
    );
  }

  if (!(loaded && taskRunsLoaded)) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <PipelineRunLogs
      className="pf-v5-u-pt-md"
      obj={pipelineRun}
      taskRuns={taskRuns}
      workspace={workspace}
      activeTask={activeTask}
      onActiveTaskChange={handleActiveTaskChange}
    />
  );
};

export default PipelineRunLogsTab;
