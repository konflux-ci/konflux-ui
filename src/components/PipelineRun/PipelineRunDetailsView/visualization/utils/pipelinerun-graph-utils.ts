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
import { TaskRunLabel } from '../../../../../consts/pipelinerun';
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
 * Appends the pipeline run status to each tasks in the pipeline.
 * @param pipeline
 * @param pipelineRun
 * @param taskRuns
 * @param isFinallyTasks
 */
// Extended type for matrix tasks
type MatrixPipelineTaskWithStatus = PipelineTaskWithStatus & {
  originalName?: string;
  matrixPlatform?: string;
};

// Helper function to create a task with status from a TaskRun
const createTaskWithStatus = (
  task: PipelineTask,
  taskRun?: TaskRunKind,
): PipelineTaskWithStatus => {
  if (!taskRun) {
    return { ...task, status: { reason: runStatus.Idle } };
  }

  const taskStatus: TaskRunStatus = taskRun.status;
  const taskResults = isTaskV1Beta1(taskRun)
    ? taskRun.status?.taskResults
    : taskRun.status?.results;

  const mTask: PipelineTaskWithStatus = {
    ...task,
    status: { ...taskStatus, reason: runStatus.Pending },
  };

  // append task duration
  if (mTask.status.completionTime && mTask.status.startTime) {
    const date =
      new Date(mTask.status.completionTime).getTime() - new Date(mTask.status.startTime).getTime();
    mTask.status.duration = formatPrometheusDuration(date);
  }

  // append task status
  if (mTask.status.conditions) {
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
        // eslint-disable-next-line no-console
        console.warn(e);
      }
    }
    const scanResult = taskResults?.find((result) => isCVEScanResult(result));

    if (scanResult) {
      try {
        mTask.status.scanResults = JSON.parse(scanResult.value);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
      }
    }
  }

  // Get the steps status
  const stepList = taskStatus?.steps || mTask?.steps || mTask?.taskSpec?.steps || [];
  mTask.steps = stepList.map((step, i, { length }) =>
    createStepStatus(step.name as string, mTask.status, i + 1 === length),
  );

  return mTask;
};

// Helper function to create a matrix task entry
const createMatrixTaskEntry = (
  task: PipelineTask,
  taskRun: TaskRunKind,
  platform: string,
): MatrixPipelineTaskWithStatus => {
  const matrixTask = createTaskWithStatus(task, taskRun) as MatrixPipelineTaskWithStatus;

  // Add platform suffix to make the name unique for React rendering
  // But preserve original name for dependency resolution
  matrixTask.name = `${task.name}-${platform.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Store original name and platform info for later use
  matrixTask.originalName = task.name;
  matrixTask.matrixPlatform = platform;

  return matrixTask;
};

export const appendStatus = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
  isFinallyTasks = false,
): PipelineTaskWithStatus[] => {
  const tasks = (isFinallyTasks ? pipeline.spec.finally : pipeline.spec.tasks) || [];
  const overallPipelineRunStatus = pipelineRunStatus(pipelineRun);

  // Group TaskRuns by pipeline task name to detect matrix tasks
  const taskRunsByTaskName = new Map<string, TaskRunKind[]>();
  taskRuns?.forEach((tr) => {
    const taskName = tr.metadata.labels?.[TektonResourceLabel.pipelineTask];
    if (taskName) {
      const existingTaskRuns = taskRunsByTaskName.get(taskName);
      if (existingTaskRuns) {
        existingTaskRuns.push(tr);
      } else {
        taskRunsByTaskName.set(taskName, [tr]);
      }
    }
  });

  // Process each pipeline task, expanding matrix tasks into multiple entries
  const result: PipelineTaskWithStatus[] = [];

  tasks.forEach((task) => {
    if (!pipelineRun?.status) {
      result.push({ ...task, status: { reason: runStatus.Pending } });
      return;
    }
    if (!taskRuns || taskRuns.length === 0) {
      result.push({ ...task, status: { reason: overallPipelineRunStatus } });
      return;
    }

    const taskRunsForTask = taskRunsByTaskName.get(task.name) || [];

    // If no TaskRuns found, create a single task entry
    if (taskRunsForTask.length === 0) {
      const isSkipped = !!pipelineRun.status.skippedTasks?.find((t) => t.name === task.name);
      result.push({
        ...task,
        status: { reason: isSkipped ? runStatus.Skipped : runStatus.Idle },
      });
      return;
    }

    // Check if this is a matrix task (multiple TaskRuns with platform labels)
    const platformTaskRuns = taskRunsForTask.filter(
      (tr) => tr.metadata.labels?.[TaskRunLabel.TARGET_PLATFORM],
    );

    if (platformTaskRuns.length > 1) {
      // Matrix task detected - create one entry per platform
      platformTaskRuns.forEach((taskRun) => {
        const platform = taskRun.metadata.labels[TaskRunLabel.TARGET_PLATFORM];
        const platformDisplay = platform?.replace(/-/g, '/') || 'unknown';

        const matrixTask = createMatrixTaskEntry(task, taskRun, platformDisplay);
        result.push(matrixTask);
      });
    } else {
      // Regular task or single-platform matrix - create single entry
      const taskRun = taskRunsForTask[0];
      const regularTask = createTaskWithStatus(task, taskRun);
      result.push(regularTask);
    }
  });

  return result;
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

const hasParentDep = (
  dep: string,
  otherDeps: string[],
  nodes: PipelineRunNodeModel<PipelineRunNodeData, PipelineRunNodeType>[],
): boolean => {
  if (!otherDeps?.length) {
    return false;
  }

  for (const otherDep of otherDeps) {
    if (otherDep === dep) {
      continue;
    }
    const depNode = nodes.find((n) => n.id === otherDep);
    if (!depNode) {
      // Try to find by original name (for matrix tasks)
      const depNodeByOriginal = nodes.find((n) => {
        const matrixTask = n.data.task as MatrixPipelineTaskWithStatus;
        return matrixTask.originalName === otherDep;
      });
      if (
        depNodeByOriginal?.runAfterTasks?.includes(dep) ||
        hasParentDep(dep, depNodeByOriginal?.runAfterTasks || [], nodes)
      ) {
        return true;
      }
    }
    if (depNode.runAfterTasks?.includes(dep) || hasParentDep(dep, depNode.runAfterTasks, nodes)) {
      return true;
    }
  }
  return false;
};

// Helper function to expand matrix task dependencies
const expandMatrixDependencies = (deps: string[], taskList: PipelineTaskWithStatus[]): string[] => {
  const expandedDeps: string[] = [];

  deps.forEach((dep) => {
    // Find all matrix instances of this dependency
    const matrixInstances = taskList.filter((task) => {
      const matrixTask = task as MatrixPipelineTaskWithStatus;
      return matrixTask.originalName === dep || task.name === dep;
    });

    if (matrixInstances.length > 1) {
      // This is a matrix task - add all instances
      matrixInstances.forEach((instance) => expandedDeps.push(instance.name));
    } else {
      // Regular task or single instance
      expandedDeps.push(dep);
    }
  });

  return expandedDeps;
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
  const taskList = appendStatus(pipeline, pipelineRun, taskRuns);

  const nodes: PipelineRunNodeModel<PipelineRunNodeData, PipelineRunNodeType>[] = taskList.map(
    (task) => {
      const runAfterTasks = [...(task.runAfter || [])];
      if (task.params) {
        task.params.map((p) => {
          if (Array.isArray(p.value)) {
            p.value.forEach((paramValue: string) => {
              runAfterTasks.push(...extractDepsFromContextVariables(paramValue));
            });
          } else {
            runAfterTasks.push(...extractDepsFromContextVariables(p.value as string));
          }
        });
      }
      if (task?.when) {
        task.when.forEach(({ input, values }) => {
          runAfterTasks.push(...extractDepsFromContextVariables(input));
          values.forEach((whenValue) => {
            runAfterTasks.push(...extractDepsFromContextVariables(whenValue));
          });
        });
      }

      // Expand matrix task dependencies
      const expandedRunAfterTasks = expandMatrixDependencies(runAfterTasks, taskList);

      // For matrix tasks, use a display name that includes platform info
      const matrixTask = task as MatrixPipelineTaskWithStatus;
      const displayName = matrixTask.matrixPlatform
        ? `${matrixTask.originalName} (${matrixTask.matrixPlatform})`
        : task.name;

      // For matrix tasks, find the specific TaskRun for this platform
      let taskRunForTask: TaskRunKind | undefined;
      if (matrixTask.matrixPlatform) {
        // Matrix task - find TaskRun with matching platform label
        const platformLabel = matrixTask.matrixPlatform.replace(/\//g, '-');
        taskRunForTask = taskRuns.find(
          (tr) =>
            tr.metadata.labels[TektonResourceLabel.pipelineTask] === matrixTask.originalName &&
            tr.metadata.labels[TaskRunLabel.TARGET_PLATFORM] === platformLabel,
        );
      } else {
        // Regular task - find by task name
        taskRunForTask = taskRuns.find(
          (tr) => tr.metadata.labels[TektonResourceLabel.pipelineTask] === task.name,
        );
      }

      return {
        id: task.name,
        type: PipelineRunNodeType.TASK_NODE,
        label: displayName,
        runAfterTasks: expandedRunAfterTasks,
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
          taskRun: taskRunForTask,
        },
      };
    },
  );

  // Remove extraneous dependencies
  nodes.forEach(
    (taskNode) =>
      (taskNode.runAfterTasks = taskNode.runAfterTasks.filter(
        (dep) => !hasParentDep(dep, taskNode.runAfterTasks, nodes),
      )),
  );

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

  const finallyTaskList = appendStatus(pipeline, pipelineRun, taskRuns, true);

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
      taskRun: taskRuns.find(
        (tr) => tr.metadata.labels[TektonResourceLabel.pipelineTask] === fTask.name,
      ),
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
      const scrollLeftEdge = nodeBounds.x;
      const scrollRightEdge = nodeBounds.x + nodeBounds.width - scrollPane.offsetWidth;
      if (scrollPane.scrollLeft < scrollRightEdge) {
        left = scrollRightEdge;
      } else if (scrollPane.scrollLeft > scrollLeftEdge) {
        left = scrollLeftEdge;
      }
      if (left != null) {
        scrollPane.scrollTo({ left, behavior: 'smooth' });
      }
    } else {
      targetNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }
};
