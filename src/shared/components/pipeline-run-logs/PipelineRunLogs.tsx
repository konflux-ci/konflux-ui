import * as React from 'react';
import { Nav, NavItem, NavList } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import get from 'lodash/get';
import { PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { ColoredStatusIcon } from '../../../components/topology/StatusIcon';
import { PodGroupVersionKind } from '../../../models/pod';
import { PipelineRunKind, PipelineTask, TaskRunKind, TektonResourceLabel } from '../../../types';
import { WatchK8sResource } from '../../../types/k8s';
import { pipelineRunStatus, taskRunStatus } from '../../../utils/pipeline-utils';
import { ErrorDetailsWithStaticLog } from './logs/log-snippet-types';
import { getDownloadAllLogsCallback } from './logs/logs-utils';
import LogsWrapperComponent from './logs/LogsWrapperComponent';
import { getPLRLogSnippet } from './logs/pipelineRunLogSnippet';

import './PipelineRunLogs.scss';

interface PipelineRunLogsProps {
  className?: string;
  obj: PipelineRunKind;
  taskRuns: TaskRunKind[];
  activeTask?: string;
  onActiveTaskChange?: (value: string) => void;
}
interface PipelineRunLogsState {
  activeItem: string;
  navUntouched: boolean;
}
class PipelineRunLogs extends React.Component<PipelineRunLogsProps, PipelineRunLogsState> {
  constructor(props: PipelineRunLogsProps) {
    super(props);
    this.state = { activeItem: null, navUntouched: true };
  }

  componentDidMount() {
    const { activeTask, taskRuns, obj, onActiveTaskChange } = this.props;
    const sortedTaskRuns = this.getSortedTaskRun(taskRuns, [
      ...(obj?.status?.pipelineSpec?.tasks || []),
      ...(obj?.status?.pipelineSpec?.finally || []),
    ]);
    const activeItem = this.getActiveTaskRun(sortedTaskRuns, activeTask);
    const taskName = this.getTaskRunName(activeItem);
    if (!activeTask && taskName) {
      onActiveTaskChange?.(taskName);
    }
    this.setState({ activeItem });
  }

  UNSAFE_componentWillReceiveProps(nextProps: PipelineRunLogsProps) {
    if (this.props.obj !== nextProps.obj || this.props.taskRuns !== nextProps.taskRuns) {
      const { activeTask, taskRuns } = this.props;
      const sortedTaskRuns = this.getSortedTaskRun(taskRuns, [
        ...(this.props?.obj?.status?.pipelineSpec?.tasks || []),
        ...(this.props?.obj?.status?.pipelineSpec?.finally || []),
      ]);
      const activeItem = this.getActiveTaskRun(sortedTaskRuns, activeTask);
      this.state.navUntouched && this.setState({ activeItem });
    }
  }

  getActiveTaskRun = (taskRuns: TaskRunKind[], activeTask: string): string => {
    const activeTaskRun = activeTask
      ? taskRuns.find((taskRun) => taskRun.metadata.name.endsWith(activeTask))
      : taskRuns.find((taskRun) => taskRunStatus(taskRun) === runStatus.Failed) ||
        taskRuns[taskRuns.length - 1];

    return activeTaskRun?.metadata.name;
  };

  getTaskRunLabel = (taskRun: TaskRunKind, taskRunName: string) => {
    const pipelineRunName =
      taskRun.metadata?.labels?.[PipelineRunLabel.PIPELINE_NAME] ??
      taskRun.metadata?.labels?.[PipelineRunLabel.PIPELINERUN_NAME];

    if (pipelineRunName && taskRunName?.startsWith(`${pipelineRunName}-`)) {
      return taskRunName.replace(`${pipelineRunName}-`, '');
    }

    return taskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask];
  };

  getTaskRunName = (taskRunName: string | undefined): string | undefined => {
    if (!taskRunName) {
      return undefined;
    }

    const taskRun = this.props.taskRuns.find((tr) => tr.metadata.name === taskRunName);
    const label = taskRun && this.getTaskRunLabel(taskRun, taskRunName);

    return label ?? taskRunName;
  };

  sortTaskRunsByCompletionTime = (a: TaskRunKind, b: TaskRunKind) => {
    if (get(a, ['status', 'completionTime'], false)) {
      return b.status?.completionTime &&
        new Date(a.status.completionTime) > new Date(b.status.completionTime)
        ? 1
        : -1;
    }
    return b.status?.completionTime || new Date(a.status?.startTime) > new Date(b.status?.startTime)
      ? 1
      : -1;
  };

  getSortedTaskRun = (tRuns: TaskRunKind[], tasks: PipelineTask[]): TaskRunKind[] => {
    const taskRuns = tRuns?.sort(this.sortTaskRunsByCompletionTime);

    const pipelineTaskNames = tasks?.map((t) => t?.name);
    return (
      taskRuns?.sort((a, b) => {
        const aTaskLabel = a?.metadata?.labels?.[TektonResourceLabel.pipelineTask];
        const bTaskLabel = b?.metadata?.labels?.[TektonResourceLabel.pipelineTask];
        const aTaskIndex = pipelineTaskNames?.indexOf(aTaskLabel) ?? -1;
        const bTaskIndex = pipelineTaskNames?.indexOf(bTaskLabel) ?? -1;

        // sort by pipeline task order
        const taskOrderDiff = aTaskIndex - bTaskIndex;
        if (taskOrderDiff !== 0) {
          return taskOrderDiff;
        }

        // sort by completion time if pipeline tasks are the same
        return this.sortTaskRunsByCompletionTime(a, b);
      }) || []
    );
  };

  onNavSelect = (item: { itemId: number | string }) => {
    const { onActiveTaskChange } = this.props;
    const selectedTaskName = this.getTaskRunName(item.itemId as string);
    if (selectedTaskName) {
      onActiveTaskChange?.(selectedTaskName);
    }
    this.setState({
      activeItem: item.itemId as string,
      navUntouched: false,
    });
  };

  render() {
    const { className, obj, taskRuns } = this.props;
    const { activeItem } = this.state;

    const sortedTaskRuns = this.getSortedTaskRun(taskRuns, [
      ...(obj?.status?.pipelineSpec?.tasks || []),
      ...(obj?.status?.pipelineSpec?.finally || []),
    ]);
    const taskRunMap = new Map<string, TaskRunKind>(
      sortedTaskRuns.map((t) => [t.metadata.name, t]),
    );

    const logDetails = getPLRLogSnippet(obj, taskRuns) as ErrorDetailsWithStaticLog;
    const pipelineStatus = pipelineRunStatus(obj);

    const taskCount = taskRunMap.size;
    const taskRunNames = Array.from(taskRunMap.keys());
    const downloadAllCallback =
      taskCount > 1
        ? getDownloadAllLogsCallback(
            taskRunNames,
            taskRuns,
            obj.metadata?.namespace,
            obj.metadata?.name,
          )
        : undefined;
    const activeTaskRun = activeItem ? taskRunMap.get(activeItem) : undefined;
    const podName = activeTaskRun?.status?.podName;
    const resource: WatchK8sResource = taskCount > 0 &&
      podName && {
        name: podName,
        groupVersionKind: PodGroupVersionKind,
        namespace: obj.metadata.namespace,
        isList: false,
      };

    const waitingForPods = !!(activeItem && !resource);
    const taskName = activeTaskRun?.metadata?.labels?.[TektonResourceLabel.pipelineTask] || '-';
    const pipelineRunFinished = pipelineStatus !== runStatus.Running;

    const selectedItemRef = (item: HTMLSpanElement) => {
      if (item?.scrollIntoView) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    return (
      <div className={css('pipeline-run-logs', className)}>
        <div className="pipeline-run-logs__tasklist" data-test="logs-tasklist">
          {taskCount > 0 ? (
            <Nav onSelect={(_event, item) => this.onNavSelect(item)} theme="light">
              <NavList className="pipeline-run-logs__nav">
                {taskRunNames.map((taskRunName) => {
                  const taskRun = taskRunMap.get(taskRunName);
                  return (
                    <NavItem
                      key={taskRunName}
                      itemId={taskRunName}
                      isActive={activeItem === taskRunName}
                      className="pipeline-run-logs__navitem"
                    >
                      <span ref={activeItem === taskRunName ? selectedItemRef : undefined}>
                        <ColoredStatusIcon status={taskRunStatus(taskRun)} />
                        <span className="pipeline-run-logs__namespan">
                          {this.getTaskRunLabel(taskRun, taskRunName) || '-'}
                        </span>
                      </span>
                    </NavItem>
                  );
                })}
              </NavList>
            </Nav>
          ) : (
            <div className="pipeline-run-logs__nav">{'No task runs found'}</div>
          )}
        </div>
        <div className="pipeline-run-logs__container">
          {activeItem && resource ? (
            <LogsWrapperComponent
              resource={resource}
              taskRun={activeTaskRun}
              downloadAllLabel={'Download all task logs'}
              onDownloadAll={downloadAllCallback}
            />
          ) : (
            <div className="pipeline-run-logs__log">
              <div className="pipeline-run-logs__logtext" data-test="task-logs-error">
                {waitingForPods && !pipelineRunFinished && `Waiting for ${taskName} task to start `}
                {!resource && pipelineRunFinished && !obj.status && 'No logs found'}
                {logDetails && (
                  <div className="pipeline-run-logs__logsnippet">{logDetails.staticMessage}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default PipelineRunLogs;
