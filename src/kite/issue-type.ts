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

export type Issue = {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  issueType: IssueType;
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

export type IssueResponse = {
  data: Issue[];
  total: number;
  limit: number;
  offset: number;
};

export type IssuesByStatusCardProps = {
  issues: Issue[];
};
