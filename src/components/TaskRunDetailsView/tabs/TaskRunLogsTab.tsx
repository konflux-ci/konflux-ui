import * as React from 'react';
import { useParams } from 'react-router-dom';
import { RouterParams } from '@routes/utils';
import TaskRunLogs from '~/components/TaskRuns/TaskRunLogs';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { TaskRunKind } from '~/types';
import { taskRunStatus } from '~/utils/pipeline-utils';

export type TaskRunLogProps = {
  taskRun: TaskRunKind;
};

const TaskRunLogsTab: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRun] = useTaskRunV2(namespace, taskRunName);
  const status = taskRunStatus(taskRun);

  return <TaskRunLogs taskRun={taskRun} status={status} namespace={namespace} />;
};

export default TaskRunLogsTab;
