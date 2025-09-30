import { useQuery } from '@tanstack/react-query';
import { commonFetchJSON, getQueryString } from '~/k8s';
import { IssueKind, IssueQuery } from '~/types';

export const fetchIssues = (issueQuery: IssueQuery) => {
  const api = `/api/v1/issues?`;
  const options = getQueryString(issueQuery);
  const resourcePath = api + options;

  return commonFetchJSON<IssueKind[]>(resourcePath, {
    pathPrefix: 'plugins/kite',
  });
};

export const useIssues = (issueQuery: IssueQuery) => {
  return useQuery({
    queryKey: ['kite', issueQuery],
    queryFn: () => fetchIssues(issueQuery),
    // enabled: isKiteServiceEnabled,
  });
};
