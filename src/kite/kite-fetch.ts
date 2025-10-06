import { commonFetchJSON, getQueryString } from '~/k8s';
import { PLUGIN_KITE } from './const';
import { IssueQuery, IssueResponse } from './issue-type';

export const fetchHealth = () => {
  const apiEndpoint = `/api/v1/health/`;

  return commonFetchJSON(apiEndpoint, {
    pathPrefix: PLUGIN_KITE,
  });
};

export const fetchKite = (url: string, requestInit?: RequestInit) => {
  return commonFetchJSON(`/api/v1/${url}`, { ...requestInit, pathPrefix: PLUGIN_KITE });
};

export const fetchIssues = (issueQuery: IssueQuery): Promise<IssueResponse> => {
  const api = `issues/?`;
  const options = getQueryString(issueQuery);
  const resourcePath = api + options;

  return fetchKite(resourcePath) as Promise<IssueResponse>;
};
