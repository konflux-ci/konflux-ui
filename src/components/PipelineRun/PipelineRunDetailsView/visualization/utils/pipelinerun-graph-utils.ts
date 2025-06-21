import {
  DEFAULT_LAYERS,
  ElementModel,
  getEdgesFromNodes,
  getSpacerNodes,
  GraphElement,
  GraphModel,
  ModelKind,
  Node,
  WhenStatus,
} from '@patternfly/react-topology';
import { PipelineNodeModel } from '@patternfly/react-topology/src/pipelines/types';
import { isCVEScanResult } from '../../../../../hooks/useScanResults';
import { formatPrometheusDuration } from '../../../../../shared/components/timestamp/datetime';
import {
  TaskRunKind,
  TaskRunStatus,
  TektonResourceLabel,
  PipelineKind,
  PipelineTask,
  PipelineRunKind,
  PLRTaskRunStep,
  TektonResultsRun,
} from '../../../../../types';
import {
  pipelineRunStatus,
  runStatus,
  taskRunStatus,
  isTaskV1Beta1,
} from '../../../../../utils/pipeline-utils';
import { DEFAULT_FINALLLY_GROUP_PADDING, DEFAULT_NODE_HEIGHT } from '../../../../topology/const';
import { PipelineLayout } from '../../../../topology/factories';
import { NodeType, PipelineEdgeModel, PipelineMixedNodeModel } from '../../../../topology/types';
import { getLabelWidth, getTextWidth } from '../../../../topology/utils';
import {
  PipelineRunNodeData,
  PipelineRunNodeModel,
  PipelineRunNodeType,
  PipelineTaskStatus,
  PipelineTaskWithStatus,
  StepStatus,
} from '../types';

enum TerminatedReasons {
  Completed = 'Completed',
}

export const extractDepsFromContextVariables = (contextVariable: string): string[] => {
  const regex = /(?:(?:\$\(tasks.))([a-z0-9_-]+)(?:.results+)(?:[.^\w]+\))/g;
  let matches;
  const deps = [];
  while ((matches = regex.exec(contextVariable)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    if (matches) {
      if (!deps.includes(matches[1])) {
        deps.push(matches[1]);
      }
    }
  }
  return deps;
};

const getMatchingStep = (
  stepName: string,
  status: PipelineTaskStatus,
): [PLRTaskRunStep, PLRTaskRunStep] => {
  const statusSteps: PLRTaskRunStep[] = status?.steps || [];
  let prevStep: PLRTaskRunStep = null;
  const result = statusSteps.find((statusStep) => {
    // In rare occasions the status step name is prefixed with `step-`
    // This is likely a bug but this workaround will be temporary as it's investigated separately
    const found = statusStep.name === stepName || statusStep.name === `step-${stepName}`;
    if (!found) {
      prevStep = statusStep;
    }
    return found;
  });
  return [result, prevStep];
};

export const getPipelineFromPipelineRun = (pipelineRun: PipelineRunKind): PipelineKind => {
  const PIPELINE_LABEL = 'tekton.dev/pipeline';
  const pipelineName =
    pipelineRun?.metadata?.labels?.[PIPELINE_LABEL] || pipelineRun?.metadata?.name;
  const pipelineSpec = pipelineRun?.status?.pipelineSpec || pipelineRun?.spec?.pipelineSpec;

  if (!pipelineName || !pipelineSpec) {
    return null;
  }
  return {
    apiVersion: pipelineRun.apiVersion,
    kind: 'Pipeline',
    metadata: {
      name: pipelineName,
      namespace: pipelineRun.metadata.namespace,
    },
    spec: pipelineSpec,
  };
};

export const createStepStatus = (
  stepName: string,
  status: PipelineTaskStatus,
  isFinalStep: boolean = false,
): StepStatus => {
  let stepRunStatus: runStatus = runStatus.Pending;
  let startTime: string;
  let endTime: string;

  const [matchingStep, prevStep] = getMatchingStep(stepName, status);
  if (!status || !status.reason) {
    stepRunStatus = runStatus.Cancelled;
  } else {
    if (!matchingStep) {
      stepRunStatus = runStatus.Pending;
    } else if (matchingStep.terminated) {
      stepRunStatus =
        status.reason === runStatus.TestFailed && isFinalStep
          ? runStatus.TestFailed
          : matchingStep.terminated.reason === TerminatedReasons.Completed
            ? runStatus.Succeeded
            : runStatus.Failed;
      startTime = matchingStep.terminated.startedAt;
      endTime = matchingStep.terminated.finishedAt;
    } else if (matchingStep.running) {
      if (!prevStep) {
        stepRunStatus = runStatus.Running;
        startTime = matchingStep.running.startedAt;
      } else if (prevStep.terminated) {
        stepRunStatus = runStatus.Running;
        startTime = prevStep.terminated.finishedAt;
      } else {
        stepRunStatus = runStatus.Pending;
      }
    } else if (matchingStep.waiting) {
      stepRunStatus = runStatus.Pending;
    }
  }

  return {
    startTime,
    endTime,
    name: stepName,
    status: stepRunStatus,
  };
};

/**
 * Creates separate task entries for matrix tasks based on their TaskRuns
 * @param pipeline
 * @param pipelineRun
 * @param taskRuns
 * @param isFinallyTasks
 */
const createMatrixTaskEntries = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
  isFinallyTasks = false,
): PipelineTaskWithStatus[] => {
  const tasks = (isFinallyTasks ? pipeline.spec.finally : pipeline.spec.tasks) || [];
  const taskEntries: PipelineTaskWithStatus[] = [];

  tasks.forEach((task) => {
    if (!pipelineRun?.status) {
      taskEntries.push({ ...task, status: { reason: runStatus.Pending } });
      return;
    }

    // Find all TaskRuns for this task (including matrix combinations)
    const taskTaskRuns = taskRuns.filter(
      (tr) => tr.metadata.labels[TektonResourceLabel.pipelineTask] === task.name,
    );

    // Check if this task has a matrix configuration in the pipeline spec
    const hasMatrixConfig =
      task.matrix &&
      (task.matrix.params?.length > 0 ||
        task.matrix.include?.length > 0 ||
        task.matrix.exclude?.length > 0);

    if (hasMatrixConfig) {
      // If TaskRuns exist, use their count; otherwise, use the matrix param length
      const matrixCount =
        taskTaskRuns.length > 0
          ? taskTaskRuns.length
          : Array.isArray(task.matrix?.params?.[0]?.value)
            ? task.matrix.params[0].value.length
            : 2;
      const isSkipped = !!pipelineRun.status.skippedTasks?.find((t) => t.name === task.name);

      // Get matrix parameter values for naming
      const matrixParams = task.matrix?.params || [];
      const paramValues =
        matrixParams.length > 0 && Array.isArray(matrixParams[0].value)
          ? matrixParams[0].value
          : [];

      for (let i = 0; i < matrixCount; i++) {
        // Create descriptive name with parameter value if available
        let taskName = `${task.name}-${i}`;
        if (paramValues[i] !== undefined) {
          taskName = `${task.name}  (${paramValues[i]})`;
        }

        taskEntries.push({
          ...task,
          name: taskName,
          status: { reason: isSkipped ? runStatus.Skipped : runStatus.Idle },
        });
      }
      return;
    }

    if (taskTaskRuns.length === 0) {
      // No TaskRuns and not a matrix task
      const isSkipped = !!pipelineRun.status.skippedTasks?.find((t) => t.name === task.name);
      taskEntries.push({
        ...task,
        status: { reason: isSkipped ? runStatus.Skipped : runStatus.Idle },
      });
      return;
    }

    // If there's only one TaskRun and no matrix config, it's not a matrix task
    if (taskTaskRuns.length === 1 && !hasMatrixConfig) {
      const taskRun = taskTaskRuns[0];
      const taskStatus: TaskRunStatus = taskRun?.status;
      const taskResults = isTaskV1Beta1(taskRun)
        ? taskRun?.status?.taskResults
        : taskRun?.status?.results;

      const mTask: PipelineTaskWithStatus = {
        ...task,
        status: { ...taskStatus, reason: runStatus.Pending },
      };

      // append task duration
      if (mTask.status.completionTime && mTask.status.startTime) {
        const date =
          new Date(mTask.status.completionTime).getTime() -
          new Date(mTask.status.startTime).getTime();
        mTask.status.duration = formatPrometheusDuration(date);
      }
      // append task status
      if (!taskStatus) {
        const isSkipped = !!pipelineRun.status.skippedTasks?.find((t) => t.name === task.name);
        if (isSkipped) {
          mTask.status.reason = runStatus.Skipped;
        } else {
          mTask.status.reason = runStatus.Idle;
        }
      } else if (mTask.status.conditions) {
        mTask.status.reason = taskRunStatus(taskRun);
      }

      // Determine any task test status
      if (taskResults) {
        const testOutput: TektonResultsRun = taskResults.find(
          (result) => result.name === 'HACBS_TEST_OUTPUT' || result.name === 'TEST_OUTPUT',
        );
        if (testOutput) {
          try {
            const outputValues = JSON.parse(testOutput.value);
            mTask.status.testFailCount = parseInt(outputValues.failures as string, 10);
            mTask.status.testWarnCount = parseInt(outputValues.warnings as string, 10);
          } catch (e) {
            // ignore
          }
        }
        const scanResult = taskResults?.find((result) => isCVEScanResult(result));

        if (scanResult) {
          try {
            mTask.status.scanResults = JSON.parse(scanResult.value);
          } catch (e) {
            // ignore
          }
        }
      }
      // Get the steps status
      const stepList = taskStatus?.steps || mTask?.steps || mTask?.taskSpec?.steps || [];
      mTask.steps = stepList.map((step, i, { length }) =>
        createStepStatus(step.name as string, mTask.status, i + 1 === length),
      );

      taskEntries.push(mTask);
    } else {
      // This is a matrix task - create separate entries for each TaskRun
      // If we have TaskRuns, use their count, otherwise use the matrix config to estimate
      const matrixCount = taskTaskRuns.length > 0 ? taskTaskRuns.length : 2;

      // Get matrix parameter values for naming
      const matrixParams = task.matrix?.params || [];
      const paramValues =
        matrixParams.length > 0 && Array.isArray(matrixParams[0].value)
          ? matrixParams[0].value
          : [];

      for (let index = 0; index < matrixCount; index++) {
        const taskRun = taskTaskRuns[index];
        const taskStatus: TaskRunStatus = taskRun?.status;
        const taskResults = isTaskV1Beta1(taskRun)
          ? taskRun?.status?.taskResults
          : taskRun?.status?.results;

        // Create descriptive name with parameter value if available
        let taskName = `${task.name}-${index}`;
        if (paramValues[index] !== undefined) {
          taskName = `${task.name}  (${paramValues[index]})`;
        }

        const mTask: PipelineTaskWithStatus = {
          ...task,
          name: taskName,
          status: { ...taskStatus, reason: runStatus.Pending },
        };

        // append task duration
        if (mTask.status.completionTime && mTask.status.startTime) {
          const date =
            new Date(mTask.status.completionTime).getTime() -
            new Date(mTask.status.startTime).getTime();
          mTask.status.duration = formatPrometheusDuration(date);
        }
        // append task status
        if (!taskStatus) {
          const isSkipped = !!pipelineRun.status.skippedTasks?.find((t) => t.name === task.name);
          if (isSkipped) {
            mTask.status.reason = runStatus.Skipped;
          } else {
            mTask.status.reason = runStatus.Idle;
          }
        } else if (mTask.status.conditions) {
          mTask.status.reason = taskRunStatus(taskRun);
        }

        // Determine any task test status
        if (taskResults) {
          const testOutput: TektonResultsRun = taskResults.find(
            (result) => result.name === 'HACBS_TEST_OUTPUT' || result.name === 'TEST_OUTPUT',
          );
          if (testOutput) {
            try {
              const outputValues = JSON.parse(testOutput.value);
              mTask.status.testFailCount = parseInt(outputValues.failures as string, 10);
              mTask.status.testWarnCount = parseInt(outputValues.warnings as string, 10);
            } catch (e) {
              // ignore
            }
          }
          const scanResult = taskResults?.find((result) => isCVEScanResult(result));

          if (scanResult) {
            try {
              mTask.status.scanResults = JSON.parse(scanResult.value);
            } catch (e) {
              // ignore
            }
          }
        }
        // Get the steps status
        const stepList = taskStatus?.steps || mTask?.steps || mTask?.taskSpec?.steps || [];
        mTask.steps = stepList.map((step, i, { length }) =>
          createStepStatus(step.name as string, mTask.status, i + 1 === length),
        );

        taskEntries.push(mTask);
      }
    }
  });

  return taskEntries;
};

/**
 * Appends the pipeline run status to each tasks in the pipeline.
 * @param pipeline
 * @param pipelineRun
 * @param taskRuns
 * @param isFinallyTasks
 */
export const appendStatus = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
  isFinallyTasks = false,
): PipelineTaskWithStatus[] => {
  const tasks = (isFinallyTasks ? pipeline.spec.finally : pipeline.spec.tasks) || [];

  return tasks.map((task) => {
    if (!pipelineRun?.status) {
      return { ...task, status: { reason: runStatus.Pending } };
    }
    if (!taskRuns || taskRuns.length === 0) {
      return { ...task, status: { reason: pipelineRunStatus(pipelineRun) } };
    }

    const taskRun = taskRuns.find(
      (tr) => tr.metadata.labels[TektonResourceLabel.pipelineTask] === task.name,
    );
    const taskStatus: TaskRunStatus = taskRun?.status;
    const taskResults = isTaskV1Beta1(taskRun)
      ? taskRun?.status?.taskResults
      : taskRun?.status?.results;

    const mTask: PipelineTaskWithStatus = {
      ...task,
      status: { ...taskStatus, reason: runStatus.Pending },
    };

    // append task duration
    if (mTask.status.completionTime && mTask.status.startTime) {
      const date =
        new Date(mTask.status.completionTime).getTime() -
        new Date(mTask.status.startTime).getTime();
      mTask.status.duration = formatPrometheusDuration(date);
    }
    // append task status
    if (!taskStatus) {
      const isSkipped = !!pipelineRun.status.skippedTasks?.find((t) => t.name === task.name);
      if (isSkipped) {
        mTask.status.reason = runStatus.Skipped;
      } else {
        mTask.status.reason = runStatus.Idle;
      }
    } else if (mTask.status.conditions) {
      mTask.status.reason = taskRunStatus(taskRun);
    }

    // Determine any task test status
    if (taskResults) {
      const testOutput: TektonResultsRun = taskResults.find(
        (result) => result.name === 'HACBS_TEST_OUTPUT' || result.name === 'TEST_OUTPUT',
      );
      if (testOutput) {
        try {
          const outputValues = JSON.parse(testOutput.value);
          mTask.status.testFailCount = parseInt(outputValues.failures as string, 10);
          mTask.status.testWarnCount = parseInt(outputValues.warnings as string, 10);
        } catch (e) {
          // ignore
        }
      }
      const scanResult = taskResults?.find((result) => isCVEScanResult(result));

      if (scanResult) {
        try {
          mTask.status.scanResults = JSON.parse(scanResult.value);
        } catch (e) {
          // ignore
        }
      }
    }
    // Get the steps status
    const stepList = taskStatus?.steps || mTask?.steps || mTask?.taskSpec?.steps || [];
    mTask.steps = stepList.map((step, i, { length }) =>
      createStepStatus(step.name as string, mTask.status, i + 1 === length),
    );

    return mTask;
  });
};

export const taskHasWhenExpression = (task: PipelineTask): boolean => task?.when?.length > 0;

export const nodesHasWhenExpression = (nodes: PipelineMixedNodeModel[]): boolean =>
  nodes.some((n) => taskHasWhenExpression(n.data?.task as PipelineTask));

export const getWhenStatus = (status: runStatus): WhenStatus => {
  switch (status) {
    case runStatus.Succeeded:
    case runStatus.Failed:
      return WhenStatus.Met;
    case runStatus.Skipped:
    case runStatus['In Progress']:
    case runStatus.Idle:
      return WhenStatus.Unmet;
    default:
      return undefined;
  }
};

export const taskWhenStatus = (task: PipelineTaskWithStatus): WhenStatus | undefined => {
  if (!task.when) {
    return undefined;
  }

  return getWhenStatus(task.status?.reason);
};

export const getTaskBadgeCount = (data: PipelineRunNodeData): number =>
  (data.testFailCount ?? 0) + (data.testWarnCount ?? 0) ||
  (data.scanResults?.vulnerabilities?.critical ?? 0) +
    (data.scanResults?.vulnerabilities?.high ?? 0) +
    (data.scanResults?.vulnerabilities?.medium ?? 0) +
    (data.scanResults?.vulnerabilities?.low ?? 0) +
    (data.scanResults?.vulnerabilities?.unknown ?? 0);

const getBadgeWidth = (data: PipelineRunNodeData, font: string = '0.875rem RedHatText'): number => {
  const BADGE_PADDING = 24; // 8 before the badge and 8 on each side of the text inside the badge
  const badgeCount = getTaskBadgeCount(data);

  if (!badgeCount) {
    return 0;
  }
  return BADGE_PADDING + getTextWidth(`${badgeCount}`, font);
};

const getNodeLevel = (
  node: PipelineRunNodeModel<PipelineRunNodeData, PipelineRunNodeType>,
  allNodes: PipelineRunNodeModel<PipelineRunNodeData, PipelineRunNodeType>[],
) => {
  const children = allNodes.filter((n) => n.runAfterTasks?.includes(node.label));
  if (!children.length) {
    return 0;
  }
  const maxChildLevel = children.reduce(
    (maxLevel, child) => Math.max(getNodeLevel(child, allNodes) as number, maxLevel),
    0,
  );

  return maxChildLevel + 1;
};

/**
 * Resolves matrix task dependencies by finding the actual node IDs for matrix tasks
 * @param dep The dependency name (e.g., "build-container")
 * @param nodes All available nodes
 * @returns Array of actual node IDs that match the dependency
 */
const resolveMatrixDependencies = (
  dep: string,
  nodes: PipelineRunNodeModel<PipelineRunNodeData, PipelineRunNodeType>[],
): string[] => {
  // First, try to find an exact match
  const exactMatch = nodes.find((n) => n.id === dep);
  if (exactMatch) {
    return [dep];
  }

  // If no exact match, look for matrix tasks that start with the dependency name
  // Handle both formats: taskname-index and taskname  (paramvalue)
  const matrixMatches = nodes.filter((n) => {
    // Check if the node ID starts with the dependency name followed by a dash or spaces
    if (!n.id.startsWith(dep)) {
      return false;
    }

    // Extract the suffix after the task name
    const suffix = n.id.substring(dep.length);

    // Check if it's a number (old format) or contains parentheses (new format)
    return /^-\d+$/.test(suffix) || suffix.includes('(');
  });

  if (matrixMatches.length > 0) {
    return matrixMatches.map((n) => n.id);
  }

  return [];
};

/**
 * Finds the correct TaskRun for a given task name, handling matrix tasks
 * @param taskName The task name (may include matrix index like "build-container-0" or "build-container  (linux/amd64)")
 * @param taskRuns Array of all TaskRuns
 * @returns The matching TaskRun or undefined
 */
const findTaskRunForTask = (taskName: string, taskRuns: TaskRunKind[]): TaskRunKind | undefined => {
  // If the task name contains a matrix index (e.g., "build-container-0" or "build-container  (linux/amd64)")
  if (taskName.includes('-') || taskName.includes('(')) {
    let baseTaskName: string;

    // Check if it's the new format with parentheses
    if (taskName.includes('(')) {
      const parenIndex = taskName.indexOf('(');
      baseTaskName = taskName.substring(0, parenIndex).trim();
    } else {
      // Old format with dash
      const lastDashIndex = taskName.lastIndexOf('-');
      baseTaskName = taskName.substring(0, lastDashIndex);
    }

    // Find all TaskRuns for the base task name
    const taskTaskRuns = taskRuns.filter(
      (tr) => tr.metadata.labels[TektonResourceLabel.pipelineTask] === baseTaskName,
    );

    // If it's the old format with a number suffix, use it as index
    if (taskName.includes('-') && !taskName.includes('(')) {
      const suffix = taskName.split('-').pop();
      if (/^\d+$/.test(suffix)) {
        const matrixIndex = parseInt(suffix, 10);
        return taskTaskRuns[matrixIndex];
      }
    }

    // If suffix contains parentheses, it's the new format with parameter values
    // For now, return the first TaskRun since we can't easily map parameter values to indices
    // This could be enhanced in the future to extract parameter values from TaskRun metadata
    return taskTaskRuns[0];
  }

  // For non-matrix tasks, find the first matching TaskRun
  return taskRuns.find((tr) => tr.metadata.labels[TektonResourceLabel.pipelineTask] === taskName);
};

const getGraphDataModel = (
  pipeline: PipelineKind,
  pipelineRun?: PipelineRunKind,
  taskRuns?: TaskRunKind[],
): {
  graph: GraphModel;
  nodes: (PipelineRunNodeModel<PipelineRunNodeData, PipelineRunNodeType> | PipelineNodeModel)[];
  edges: PipelineEdgeModel[];
} => {
  const taskList = createMatrixTaskEntries(pipeline, pipelineRun, taskRuns);

  const nodes: PipelineRunNodeModel<PipelineRunNodeData, PipelineRunNodeType>[] = taskList.map(
    (task) => {
      // Only use explicit runAfter dependencies for graph edges
      // Parameter and when expression dependencies are for data flow, not execution order
      const runAfterTasks = [...(task.runAfter || [])];

      return {
        id: task.name,
        type: PipelineRunNodeType.TASK_NODE,
        label: task.name,
        runAfterTasks,
        height: DEFAULT_NODE_HEIGHT,
        data: {
          namespace: pipelineRun.metadata.namespace,
          status: task.status?.reason,
          testFailCount: task.status.testFailCount,
          testWarnCount: task.status.testWarnCount,
          scanResults: task.status.scanResults,
          whenStatus: taskWhenStatus(task),
          task,
          steps: task.steps,
          taskRun: findTaskRunForTask(task.name, taskRuns),
        },
      };
    },
  );

  // After nodes are created, resolve runAfterTasks for matrix dependencies
  nodes.forEach((node) => {
    if (node.runAfterTasks && node.runAfterTasks.length > 0) {
      const resolved = node.runAfterTasks.flatMap((dep) => resolveMatrixDependencies(dep, nodes));
      node.runAfterTasks = Array.from(new Set(resolved));
    }
  });

  // Set the level and width of each node
  nodes.forEach((taskNode) => {
    taskNode.data.level = getNodeLevel(taskNode, nodes);
    taskNode.width =
      getLabelWidth(taskNode.label) + getBadgeWidth(taskNode.data as PipelineRunNodeData);
  });

  // Set the width of nodes to the max width for it's level
  nodes.forEach((taskNode) => {
    const levelNodes = nodes.filter((n) => n.data.level === taskNode.data.level);
    taskNode.width = levelNodes.reduce((maxWidth, n) => Math.max(n.width, maxWidth), 0);
  });

  const finallyTaskList = createMatrixTaskEntries(pipeline, pipelineRun, taskRuns, true);

  const maxFinallyNodeName =
    finallyTaskList.sort((a, b) => b.name.length - a.name.length)[0]?.name || '';
  const finallyNodes = finallyTaskList.map((fTask) => ({
    type: PipelineRunNodeType.FINALLY_NODE,
    id: fTask.name,
    label: fTask.name,
    runAfterTasks: [],
    width: getLabelWidth(maxFinallyNodeName),
    height: DEFAULT_NODE_HEIGHT,
    data: {
      namespace: pipelineRun.metadata.namespace,
      status: fTask.status.reason,
      whenStatus: taskWhenStatus(fTask),
      task: fTask,
      taskRun: findTaskRunForTask(fTask.name, taskRuns),
    },
  }));
  const finallyGroup = finallyNodes.length
    ? [
        {
          id: 'finally-group-id',
          type: PipelineRunNodeType.FINALLY_GROUP,
          children: finallyNodes.map((n) => n.id),
          group: true,
          style: { padding: DEFAULT_FINALLLY_GROUP_PADDING },
        },
      ]
    : [];
  const spacerNodes: PipelineMixedNodeModel[] = getSpacerNodes(
    [...nodes, ...finallyNodes],
    NodeType.SPACER_NODE,
    [PipelineRunNodeType.FINALLY_NODE],
  );

  const edges: PipelineEdgeModel[] = getEdgesFromNodes(
    [...nodes, ...spacerNodes, ...finallyNodes],
    PipelineRunNodeType.SPACER_NODE,
    PipelineRunNodeType.EDGE,
    PipelineRunNodeType.EDGE,
    [PipelineRunNodeType.FINALLY_NODE],
    PipelineRunNodeType.EDGE,
  );
  const allNodes = [...nodes, ...spacerNodes, ...finallyNodes, ...finallyGroup];
  const hasWhenExpression = nodesHasWhenExpression(allNodes);

  return {
    graph: {
      id: 'pipelinerun-vis-graph',
      type: ModelKind.graph,
      layout: hasWhenExpression
        ? PipelineLayout.PIPELINERUN_VISUALIZATION_SPACED
        : PipelineLayout.PIPELINERUN_VISUALIZATION,
      layers: DEFAULT_LAYERS,
      y: finallyGroup.length ? 50 : 40,
      x: 15,
    },
    nodes: allNodes,
    edges,
  };
};

export const getPipelineRunDataModel = (pipelineRun: PipelineRunKind, taskRuns: TaskRunKind[]) => {
  if (!pipelineRun?.status?.pipelineSpec) {
    return null;
  }
  return getGraphDataModel(getPipelineFromPipelineRun(pipelineRun), pipelineRun, taskRuns);
};

export const isTaskNode = (e?: GraphElement): e is Node<ElementModel, PipelineRunNodeData> =>
  e?.getType() === PipelineRunNodeType.TASK_NODE ||
  e?.getType() === PipelineRunNodeType.FINALLY_NODE;

export const scrollNodeIntoView = (node: Node, scrollPane: HTMLElement) => {
  const targetNode = scrollPane.querySelector(`[data-id="${node.getId()}"]`);
  if (targetNode) {
    if (scrollPane.ownerDocument.defaultView.navigator.userAgent.search('Firefox') !== -1) {
      // Fix for firefox which does not take into consideration the full SVG node size with #scrollIntoView
      let left: number = null;
      const nodeBounds = node.getBounds();
      const nodeLeft = nodeBounds.x;
      const nodeRight = nodeBounds.x + nodeBounds.width;
      const viewportLeft = scrollPane.scrollLeft;
      const viewportRight = scrollPane.scrollLeft + scrollPane.offsetWidth;
      
      // Check if scrolling is needed
      if (nodeLeft < viewportLeft) {
        // Node is to the left of current view, scroll to show left edge
        left = nodeLeft;
      } else if (nodeRight > viewportRight) {
        // Node is to the right of current view, scroll to show right edge
        left = nodeRight - scrollPane.offsetWidth;
      }
      
      if (left != null) {
        scrollPane.scrollTo({ left, behavior: 'smooth' });
      }
    } else {
      targetNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }
};
