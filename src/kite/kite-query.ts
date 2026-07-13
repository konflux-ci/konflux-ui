import { UseInfiniteQueryOptions, QueryOptions as ReactQueryOptions } from '@tanstack/react-query';
import { PLUGIN_KITE, STALE_TIME } from './const';
import { IssueQuery, IssueResponse } from './issue-type';
import { fetchIssues } from './kite-fetch';

export const createGetIssueQueryOptions = (
  issueQuery: IssueQuery,
  options: Omit<ReactQueryOptions<IssueResponse>, 'queryKey' | 'queryFn'> = {},
) => {
  return {
    queryKey: [PLUGIN_KITE, issueQuery],
    queryFn: () => fetchIssues(issueQuery),
    staleTime: STALE_TIME,
    ...options,
  };
};

export const createInfiniteIssueQueryOptions = (
  issueQuery: IssueQuery,
  options: Omit<
    UseInfiniteQueryOptions<IssueResponse>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  > = {},
) => {
  const defaultPageSize = 20;
  return {
    queryKey: [PLUGIN_KITE, issueQuery],
    queryFn: ({ pageParam = undefined }) => {
      const paginatedQuery = {
        ...issueQuery,
        offset: pageParam,
        limit: issueQuery.limit || defaultPageSize,
      };
      return fetchIssues(paginatedQuery);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (
        !lastPage ||
        !lastPage.data ||
        lastPage.data.length < (issueQuery.limit || defaultPageSize)
      ) {
        return undefined;
      }
      return (lastPage.offset || 0) + lastPage.data.length;
    },
    staleTime: STALE_TIME,
    ...options,
  };
};
