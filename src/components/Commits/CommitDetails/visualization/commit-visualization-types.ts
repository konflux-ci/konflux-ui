import { PipelineNodeModel } from '@patternfly/react-topology';
import { runStatus } from '~/consts/pipelinerun';
import { Commit } from '../../../../types';
import { K8sResourceCommon } from '../../../../types/k8s';

export enum NodeType {
  WORKFLOW_NODE = 'workflow-node',
  SPACER_NODE = 'spacer-node',
}

export enum CommitWorkflowNodeType {
  BUILD,
  APPLICATION_TEST,
  STATIC_ENVIRONMENT,
  RELEASE,
  MANAGED_ENVIRONMENT,
  COMMIT,
}

export type CommitWorkflowNodeModelData = {
  workflowType: CommitWorkflowNodeType;
  status?: runStatus;
  application: string;
  resource?: K8sResourceCommon | Commit;
};

export type CommitWorkflowNodeModel = PipelineNodeModel & {
  data: CommitWorkflowNodeModelData;
  type: NodeType;
};
