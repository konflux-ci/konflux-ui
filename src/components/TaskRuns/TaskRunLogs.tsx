import React from 'react';
import { CodeBlock, CodeBlockCode } from '@patternfly/react-core';
import { runStatus } from '~/consts/pipelinerun';
import { PodGroupVersionKind } from '../../models/pod';
import { ErrorDetailsWithStaticLog } from '../../shared/components/pipeline-run-logs/logs/log-snippet-types';
import LogsWrapperComponent from '../../shared/components/pipeline-run-logs/logs/LogsWrapperComponent';
import { getTRLogSnippet } from '../../shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';
import { TaskRunKind } from '../../types';

type Props = {
  taskRun: TaskRunKind;
  namespace: string;
  status: runStatus;
};

const TaskRunLogs: React.FC<React.PropsWithChildren<Props>> = ({ taskRun, namespace, status }) => {
  const podName = taskRun?.status?.podName;

  if (!podName) {
    if (status === runStatus.Skipped) {
      return <div>No logs. This task was skipped.</div>;
    }
    if (status === runStatus.Idle) {
      return <div>Waiting on task to start.</div>;
    }
    if (status === runStatus.Failed) {
      const logSnippet = getTRLogSnippet(taskRun) as ErrorDetailsWithStaticLog;
      if (logSnippet?.staticMessage) {
        return (
          <div data-test="taskrun-logs-nopod">
            <CodeBlock>
              <CodeBlockCode>{logSnippet.staticMessage}</CodeBlockCode>
            </CodeBlock>
          </div>
        );
      }
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
        isList: false,
      }}
    />
  );
};

export default TaskRunLogs;
