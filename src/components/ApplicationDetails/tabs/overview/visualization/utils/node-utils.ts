import { Node, PipelineNodeModel, RunStatus } from '@patternfly/react-topology';
import {
  APPLICATION_DETAILS_PATH,
  APPLICATION_RELEASE_DETAILS_PATH,
  INTEGRATION_TEST_DETAILS_PATH,
  PIPELINERUN_LIST_PATH,
} from '@routes/paths';
import { PipelineRunLabel } from '../../../../../../consts/pipelinerun';
import { ComponentKind, PipelineRunKind } from '../../../../../../types';
import { GitOpsDeploymentHealthStatus } from '../../../../../../types/gitops-deployment';
import { K8sResourceCommon } from '../../../../../../types/k8s';
import { isPACEnabled } from '../../../../../../utils/component-utils';
import {
  BUILD_DESC,
  COMPONENT_DESC,
  MANAGED_ENV_DESC,
  pipelineRunStatus,
  RELEASE_DESC,
  runStatus,
  STATIC_ENV_DESC,
  TESTS_DESC,
} from '../../../../../../utils/pipeline-utils';
import { DEFAULT_NODE_HEIGHT } from '../../../../../topology/const';
import { NodeType } from '../const';
import { WorkflowNodeModel, WorkflowNodeModelData, WorkflowNodeType } from '../types';
import { getNodeWidth } from './visualization-utils';

const UNKNOWN_STATUS = 'unknown';

const RUN_STATUS_SEVERITIES = [
  UNKNOWN_STATUS,
  runStatus.Succeeded,
  runStatus.Idle,
  runStatus.Unknown,
  runStatus.Pending,
  runStatus.Pending,
  runStatus['In Progress'],
  runStatus.PipelineNotStarted,
  runStatus.Running,
  runStatus.NeedsMerge,
  runStatus.TestWarning,
  runStatus.TestFailed,
  runStatus.Cancelled,
  runStatus.FailedToStart,
  runStatus.Failed,
];

export const TYPE_DESCRIPTIONS = {
  [WorkflowNodeType.COMPONENT]: COMPONENT_DESC,
  [WorkflowNodeType.BUILD]: BUILD_DESC,
  [WorkflowNodeType.TESTS]: TESTS_DESC,
  [WorkflowNodeType.APPLICATION_TEST]: TESTS_DESC,
  [WorkflowNodeType.STATIC_ENVIRONMENT]: STATIC_ENV_DESC,
  [WorkflowNodeType.RELEASE]: RELEASE_DESC,
  [WorkflowNodeType.MANAGED_ENVIRONMENT]: MANAGED_ENV_DESC,
};

export const statusToRunStatus = (status: string): RunStatus => {
  switch (status) {
    case runStatus.Succeeded:
    case GitOpsDeploymentHealthStatus.Healthy:
      return RunStatus.Succeeded;
    case runStatus.Failed:
    case runStatus.FailedToStart:
    case GitOpsDeploymentHealthStatus.Degraded:
      return RunStatus.Failed;
    case runStatus.Running:
    case GitOpsDeploymentHealthStatus.Progressing:
    case runStatus['In Progress']:
      return RunStatus.Running;
    case runStatus.NeedsMerge:
      return RunStatus.Cancelled; // to show a warning
    case RunStatus.Pending:
    case GitOpsDeploymentHealthStatus.Suspended:
    case GitOpsDeploymentHealthStatus.Missing:
    case GitOpsDeploymentHealthStatus.Unknown:
      return RunStatus.Pending;
    default:
      return undefined;
  }
};

export const getLinkDataForElement = (
  element: Node<PipelineNodeModel, WorkflowNodeModelData>,
  namespace: string,
): { tab?: string; path?: string; filter?: { name: string; value: string } } => {
  const { workflowType, isDisabled, groupNode, status, resources } = element.getData();
  const label = element.getLabel();

  switch (workflowType) {
    case WorkflowNodeType.COMPONENT:
      return {
        tab: groupNode ? 'components' : `components/${label}`,
      };
    case WorkflowNodeType.BUILD:
      if (status === runStatus.NeedsMerge) {
        return {
          tab: `components`,
          filter:
            !groupNode && !isDisabled && label
              ? { name: 'name', value: label.replace('Build for ', '') }
              : undefined,
        };
      }
      return {
        tab: 'activity/pipelineruns',
        filter:
          !groupNode && !isDisabled && resources?.[0]
            ? { name: 'name', value: resources[0].metadata.name }
            : undefined,
      };
    case WorkflowNodeType.TESTS:
    case WorkflowNodeType.APPLICATION_TEST:
      return !groupNode && !isDisabled
        ? {
            path: INTEGRATION_TEST_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName: element.getData().application,
              integrationTestName: label,
            }),
          }
        : {
            tab: 'integrationtests',
          };
    case WorkflowNodeType.RELEASE:
      return !groupNode && !isDisabled
        ? {
            path: APPLICATION_RELEASE_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName: element.getData().application,
              releaseName: label,
            }),
          }
        : { tab: 'releases' };
    default:
      return {
        tab: 'overview',
      };
  }
};

export const getLinksForElement = (
  element: Node<PipelineNodeModel, WorkflowNodeModelData>,
  namespace: string,
): { elementRef: string; pipelinesRef: string; appRef: string } => {
  const linkData = getLinkDataForElement(element, namespace);

  const appPath = APPLICATION_DETAILS_PATH.createPath({
    workspaceName: namespace,
    applicationName: element.getData().application,
  });
  const tabPath = linkData.tab ? `/${linkData.tab}` : '';
  const filter = linkData.filter ? `?${linkData.filter.name}=${linkData.filter.value}` : '';

  return {
    elementRef: linkData.path ? linkData.path : `${appPath}${tabPath}${filter}`,
    pipelinesRef: PIPELINERUN_LIST_PATH.createPath({
      workspaceName: namespace,
      applicationName: element.getData().application,
    }),
    appRef: appPath,
  };
};

export const getRunStatusComponent = (
  component: ComponentKind,
  pipelineRuns: PipelineRunKind[],
): runStatus => {
  const latestPipelineRun = pipelineRuns
    .filter((pr) => pr.metadata.labels?.[PipelineRunLabel.COMPONENT] === component.metadata.name)
    .sort(
      (a, b) =>
        new Date(b.metadata.creationTimestamp).getTime() -
        new Date(a.metadata.creationTimestamp).getTime(),
    )?.[0];
  if (latestPipelineRun) {
    return pipelineRunStatus(latestPipelineRun);
  } else if (isPACEnabled(component)) {
    return runStatus.NeedsMerge;
  }
  return runStatus.Unknown;
};

export const worstWorkflowStatus = (workFlows: PipelineNodeModel[]) =>
  workFlows.reduce((worstStatus, c) => {
    const statusSeverity = RUN_STATUS_SEVERITIES.indexOf(c.data.status as string) || 0;
    if (statusSeverity > RUN_STATUS_SEVERITIES.indexOf(worstStatus)) {
      return c.data.status;
    }
    return worstStatus;
  }, '');

export const resourceToPipelineNode = (
  resource: K8sResourceCommon,
  application: string,
  workflowType: WorkflowNodeType,
  runAfterTasks: string[] = [],
  status?: runStatus,
  label?: string,
  pipelineRun?: K8sResourceCommon,
): WorkflowNodeModel<WorkflowNodeModelData> => ({
  id: resource.metadata.uid,
  label: label || resource.metadata.name,
  type: NodeType.WORKFLOW_NODE,
  height: DEFAULT_NODE_HEIGHT,
  width: getNodeWidth(label || resource.metadata.name, status),
  runAfterTasks,
  data: {
    application,
    label: label || resource.metadata.name,
    workflowType,
    status,
    resources: [resource],
    pipelineRun,
  },
});

export const emptyPipelineNode = (
  id: string,
  application: string,
  label: string,
  workflowType: WorkflowNodeType,
  runAfterTasks: string[] = [],
): WorkflowNodeModel<WorkflowNodeModelData> => ({
  id,
  label,
  type: NodeType.WORKFLOW_NODE,
  height: DEFAULT_NODE_HEIGHT,
  width: getNodeWidth(label),
  runAfterTasks,
  data: {
    application,
    label,
    isDisabled: true,
    workflowType,
  },
});

export const groupToPipelineNode = (
  id: string,
  application: string,
  label: string,
  workflowType: WorkflowNodeType,
  runAfterTasks: string[] = [],
  group: boolean,
  children?: string[],
  childNodes?: WorkflowNodeModel<WorkflowNodeModelData>[],
  resources?: K8sResourceCommon[],
  status?: runStatus,
): WorkflowNodeModel<WorkflowNodeModelData> => {
  const isDisabled = !resources?.length;
  return {
    id,
    label,
    height: DEFAULT_NODE_HEIGHT,
    type: group ? NodeType.WORKFLOW_GROUP : NodeType.WORKFLOW_NODE,
    width: getNodeWidth(label, status, childNodes?.length),
    group,
    children,
    runAfterTasks: group ? [] : runAfterTasks,
    style: { padding: [35] },
    data: {
      application,
      label,
      workflowType,
      isDisabled,
      groupNode: !group,
      status,
      resources,
      children: !isDisabled ? childNodes : undefined,
    },
  };
};

export const getBuildNodeForComponent = (
  component: ComponentKind,
  application: string,
  latestBuilds: PipelineRunKind[],
): WorkflowNodeModel<WorkflowNodeModelData> => {
  const latestBuild = latestBuilds.find(
    (build) => component.metadata.name === build.metadata.labels?.[PipelineRunLabel.COMPONENT],
  );
  if (latestBuild) {
    return resourceToPipelineNode(
      latestBuild,
      application,
      WorkflowNodeType.BUILD,
      [component.metadata.uid],
      pipelineRunStatus(latestBuild),
      `Build for ${component.metadata.name}`,
    );
  }
  const label = `Build for ${component.metadata.name}`;
  const status = isPACEnabled(component) ? runStatus.NeedsMerge : runStatus.Pending;
  return {
    id: `${component.metadata.uid}-missing`,
    label,
    type: NodeType.WORKFLOW_NODE,
    height: DEFAULT_NODE_HEIGHT,
    width: getNodeWidth(label, status),
    runAfterTasks: [component.metadata.uid],
    data: {
      application,
      label: `Build for ${component.metadata.name}`,
      isDisabled: false,
      status,
      workflowType: WorkflowNodeType.BUILD,
    },
  };
};
