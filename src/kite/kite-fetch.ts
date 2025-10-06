import { commonFetchJSON, getQueryString } from '~/k8s';
import { PLUGIN_KITE } from './const';
import { HealthResponse, IssueQuery, IssueResponse } from './issue-type';

export const fetchKite = <T = IssueResponse | HealthResponse>(
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
