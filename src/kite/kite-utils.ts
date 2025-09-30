import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { commonFetchJSON, getQueryString } from '~/k8s';
// import { useIsKiteServiceEnabled } from './conditional-checks';
import { IssueKind, IssueQuery } from '~/types';

export const fetchIssues = (issueQuery: IssueQuery) => {
  const api = `/api/v1/issues/?`;
  const options = getQueryString(issueQuery);
  const resourcePath = api + options;

  return commonFetchJSON<IssueKind[]>(resourcePath, {
    pathPrefix: 'plugins/kite',
  });
};

export const createGetIssueQueryOptions = (issueQuery: IssueQuery) => {
  // const { isKiteServiceEnabled } = useIsKiteServiceEnabled();
  return {
    queryKey: ['kite'],
    queryFn: () => fetchIssues(issueQuery),
    // enabled: isKiteServiceEnabled,
  };
};

export const useIssues = (issueQuery: IssueQuery) => {
  const { data, isLoading, error } = useQuery(createGetIssueQueryOptions(issueQuery));

  return [data, isLoading, error];
};

// Big WIP
export const useInfiniteIssues = (issueQuery: IssueQuery) => {
  return useInfiniteQuery({
    queryKey: ['kite', issueQuery],
    queryFn: () => fetchIssues(issueQuery),
    // enabled: isKiteServiceEnabled,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage || undefined, // Not sure what to put here (dont know how the data looks like)
    staleTime: 1000 * 60 * 5,
  });
};
