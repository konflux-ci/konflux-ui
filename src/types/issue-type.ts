import { K8sResourceCommon } from './k8s';

export enum IssueSeverity {
  INFO = 'info',
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum IssueType {
  BUILD = 'build',
  TEST = 'test',
  RELEASE = 'release',
  DEPENDENCY = 'dependency',
  PIPELINE = 'pipeline',
}

export enum IssueState {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
}

export type IssueQuery = {
  namespace: string;
  severity?: IssueSeverity;
  issueType?: IssueType;
  state?: IssueState;
  resourceType?: string;
  resourceName?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type IssueKind = K8sResourceCommon & {
  id: string;
  title: string;
  description: string;
  severity: IssueType;
  issueType: string;
  state: IssueState;
  detectedAt: string;
  namespace: string;
  scope: {
    resourceType: string;
    resourceName: string;
    resourceNamespace: string;
  };
  links: string[];
  createdAt: string;
  updatedAt: string;
};
