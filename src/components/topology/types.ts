import { EdgeModel, PipelineNodeModel } from '@patternfly/react-topology';
import { runStatus } from '~/consts/pipelinerun';
import { Commit, ComponentKind, PipelineRunKind, ReleaseKind } from '../../types';
import { IntegrationTestScenarioKind, ReleasePlanKind } from '../../types/coreBuildService';
import { K8sResourceCommon } from '../../types/k8s';

export enum NodeType {
  WORKFLOW_NODE = 'workflow-node',
  WORKFLOW_GROUP = 'workflow-group',
  SPACER_NODE = 'spacer-node',
}

export enum WorkflowNodeType {
  COMPONENT,
  BUILD,
  TESTS,
  APPLICATION_TEST,
  STATIC_ENVIRONMENT,
  RELEASE,
  MANAGED_ENVIRONMENT,
  PIPELINE,
  COMMIT,
}

export type WorkflowResource =
  | ComponentKind
  | IntegrationTestScenarioKind
  | PipelineRunKind
  | ReleaseKind
  | ReleasePlanKind
  | Commit;

export type WorkflowResources =
  | ComponentKind[]
  | IntegrationTestScenarioKind[]
  | PipelineRunKind[]
  | ReleaseKind[]
  | ReleasePlanKind[]
  | Commit[];

export type CommitWorkflow = {
  [key: string]: Workflow;
};

export type CommitComponentResource = {
  component: ComponentKind;
  releaseStatus: runStatus;
  buildPipelinestatus: runStatus;
  releasePlanStatus: (rp: ReleasePlanKind) => runStatus;
  integrationTestStatus: (test: IntegrationTestScenarioKind) => runStatus;
  applicationIntegrationTests: IntegrationTestScenarioKind[];
  compReleases: ReleaseKind[];
  compReleasePlans: ReleasePlanKind[];
};

export type Workflow = {
  [key: string]: {
    id: string;
    isAbstractNode?: boolean;
    data: {
      status?: runStatus | ((s: unknown) => runStatus);
      label: string;
      workflowType: WorkflowNodeType;
      isDisabled: boolean;
      resources: WorkflowResources;
    };
    runBefore: string[];
    runAfter: string[];
    runAfterResourceKey?: string;
  };
};

export type WorkflowNodeModelData = {
  application?: string;
  workflowType: WorkflowNodeType;
  isDisabled?: boolean;
  groupNode?: boolean;
  status?: runStatus;
  resources?: K8sResourceCommon[];
  hidden?: boolean;
  children?: PipelineNodeModel[];
  isParallelNode?: boolean;
};

// Graph Models
export type WorkflowNodeModel<D extends WorkflowNodeModelData> = PipelineNodeModel & {
  data: D;
  type: NodeType;
};
export type PipelineMixedNodeModel = WorkflowNodeModel<WorkflowNodeModelData> | PipelineNodeModel;

export type PipelineEdgeModel = EdgeModel;
