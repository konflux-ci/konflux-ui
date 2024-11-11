import React from 'react';
import { PodGroupVersionKind } from '../../models/pod';
import LogsWrapperComponent from '../../shared/components/pipeline-run-logs/logs/LogsWrapperComponent';
import { TaskRunKind } from '../../types';
import { runStatus } from '../../utils/pipeline-utils';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';

type Props = {
  taskRun: TaskRunKind;
  namespace: string;
  status: runStatus;
};

const TaskRunLogs: React.FC<React.PropsWithChildren<Props>> = ({ taskRun, namespace, status }) => {
  const podName = taskRun?.status?.podName;
  const { workspace } = useWorkspaceInfo();

  if (!podName) {
    if (status === runStatus.Skipped) {
      return <div>No logs. This task was skipped.</div>;
    }
    if (status === runStatus.Idle) {
      return <div>Waiting on task to start.</div>;
    }
    return <div data-test="taskrun-logs-nopod">No logs found.</div>;
  }

  return (
    <LogsWrapperComponent
      taskRun={taskRun}
      resource={{
        name: podName,
        groupVersionKind: PodGroupVersionKind,
        namespace,
        workspace,
        isList: false,
      }}
    />
  );
};

export default TaskRunLogs;
