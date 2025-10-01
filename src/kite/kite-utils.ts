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

export const useInfiniteIssues = (issueQuery: IssueQuery) => {
  const defaultPageSize = 20;
  // const { isKiteServiceEnabled } = useIsKiteServiceEnabled();
  return useInfiniteQuery({
    queryKey: ['kite', issueQuery],
    queryFn: ({ pageParam = 0 }) => {
      const paginatedQuery = {
        ...issueQuery,
        offset: pageParam,
        limit: issueQuery.limit || defaultPageSize, // Default page size
      };
      return fetchIssues(paginatedQuery);
    },
    // enabled: isKiteServiceEnabled, // Uncomment when service check is ready
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const limit = issueQuery.limit || defaultPageSize;
      if (!lastPage || lastPage.length < limit) {
        return undefined;
      }
      // Return the next offset
      return allPages.length * limit;
    },
    staleTime: 1000 * 60 * 5,
  });
};
