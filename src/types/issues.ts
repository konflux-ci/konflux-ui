export interface IssueScope {
  resourceType: string;
  resourceName: string;
  resourceNamespace: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  issueType: 'build' | 'test' | 'release' | 'dependency' | 'pipeline';
  state: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  detectedAt: string;
  namespace: string;
  scope: IssueScope;
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IssuesApiResponse {
  data: Issue[];
  total: number;
  limit: number;
  offset: number;
}

export interface IssuesApiParams {
  namespace?: string;
  severity?: Issue['severity'];
  issueType?: Issue['issueType'];
  state?: Issue['state'];
  limit?: number;
  offset?: number;
}
