import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useTaskRun } from '../../../hooks/usePipelineRuns';
import { RouterParams } from '../../../routes/utils';
import { useNamespace } from '../../../shared/providers/Namespace';
import { TaskRunKind } from '../../../types';
import { taskRunStatus } from '../../../utils/pipeline-utils';
import TaskRunLogs from '../../TaskRuns/TaskRunLogs';

export type TaskRunLogProps = {
  taskRun: TaskRunKind;
};

const TaskRunLogsTab: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRun] = useTaskRun(namespace, taskRunName);
  const status = taskRunStatus(taskRun);

  return <TaskRunLogs taskRun={taskRun} status={status} namespace={namespace} />;
};

export default TaskRunLogsTab;
