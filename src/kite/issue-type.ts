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
  links: Array<{
    id: string;
    title: string;
    url: string;
    issueId: string;
  }>;
  relatedFrom: RelatedIssue[];
  relatedTo: RelatedIssue[];
  createdAt: string;
  updatedAt: string;
};

export type RelatedIssue = {
  id: string;
  sourceID: string;
  targetID: string;
  source: Issue;
  target: Issue;
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

export type HealthResponse = {
  status: string;
  message: string;
  timestamp: string;
  components: {
    api: {
      status: string;
      message: string;
      details: {
        version: string;
      };
    };
    database: {
      status: string;
      message: string;
      details: {
        connection_status: string;
        response_time_seconds: number;
        open_connections: number;
        idle_connections: number;
        max_open_connections: number;
      };
    };
    response_time: {
      status: string;
      message: string;
      details: {
        duration_seconds: number;
      };
    };
  };
};

export type IssueCounts = {
  counts?: Record<string, number>;
  isLoaded: boolean;
  error: unknown;
};
