import { commonFetchJSON, getQueryString } from '~/k8s';
import { PLUGIN_KITE } from './const';
import { HealthResponse, Issue, IssueQuery, IssueResponse } from './issue-type';

export const fetchKite = <T = IssueResponse | HealthResponse | Issue>(
  url: string,
  requestInit?: RequestInit,
): Promise<T> => {
  return commonFetchJSON(`/api/v1/${url}`, { ...requestInit, pathPrefix: PLUGIN_KITE });
};

export const fetchHealth = (): Promise<HealthResponse> => {
  return fetchKite<HealthResponse>('health/');
};

export const fetchIssues = (issueQuery: IssueQuery): Promise<IssueResponse> => {
  const api = `issues/?`;
  const options = getQueryString(issueQuery);
  const resourcePath = api + options;

  return fetchKite<IssueResponse>(resourcePath);
};

export const resolveIssue = (id: string, namespace?: string): Promise<Issue> => {
  const query = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
  return fetchKite<Issue>(`issues/${id}/resolve${query}`, { method: 'POST' });
};
