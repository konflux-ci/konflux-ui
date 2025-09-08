import * as React from 'react';
import { useParams } from 'react-router-dom';
import { RouterParams } from '@routes/utils';
import TaskRunLogs from '~/components/TaskRuns/TaskRunLogs';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { TaskRunKind } from '~/types';
import { taskRunStatus } from '~/utils/pipeline-utils';
import '../../TaskRuns/TaskRunLogs.scss';

export type TaskRunLogProps = {
  taskRun: TaskRunKind;
};

const TaskRunLogsTab: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRun] = useTaskRunV2(namespace, taskRunName);
  const status = taskRunStatus(taskRun);

  return (
    <div className="task-run-logs-tab">
      <TaskRunLogs taskRun={taskRun} status={status} namespace={namespace} />
    </div>
  );
};

export default TaskRunLogsTab;
