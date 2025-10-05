import { TektonParam, TektonTaskSpec, TektonWorkspace } from './coreTekton';
import { K8sResourceCommon } from './k8s';
import { TaskRunStatus } from './task-run';

export type PipelineTaskRef = {
  resolver?: string;
  kind?: string;
  name?: string;
  params?: {
    name: string;
    value: string;
  }[];
};

export type PipelineTaskWorkspace = {
  name: string;
  workspace: string;
  optional?: boolean;
};

export type PipelineTaskResource = {
  name: string;
  resource?: string;
  from?: string[];
};

export type PipelineTaskParam = {
  name: string;
  value: unknown;
};

export type WhenExpression = {
  input: string;
  operator: string;
  values: string[];
};

export type PipelineResult = {
  name: string;
  value: string;
  description?: string;
};

export type PipelineTask = {
  name: string;
  params?: PipelineTaskParam[];
  runAfter?: string[];
  taskRef?: PipelineTaskRef;
  taskSpec?: TektonTaskSpec;
  when?: WhenExpression[];
  workspaces?: PipelineTaskWorkspace[];
  status?: TaskRunStatus;
  matrix?: {
    params: { name: string; value: string | string[] }[];
  };
};

export type PipelineSpec = {
  params?: TektonParam[];
  serviceAccountName?: string;
  tasks: PipelineTask[];
  workspaces?: TektonWorkspace[];
  finally?: PipelineTask[];
  results?: PipelineResult[];
};

export type PipelineKind = K8sResourceCommon & {
  spec: PipelineSpec;
};
