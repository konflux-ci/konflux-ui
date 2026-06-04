import { UseInfiniteQueryOptions, QueryOptions as ReactQueryOptions } from '@tanstack/react-query';
import { isDeveloperMockMode, MOCK_ISSUES, mockIssueResponse } from '~/dev-mock';
import { PLUGIN_KITE, STALE_TIME } from './const';
import { IssueQuery, IssueResponse } from './issue-type';
import { fetchIssues } from './kite-fetch';

const mockFetchIssues = (issueQuery: IssueQuery): IssueResponse => {
  let issues = [...MOCK_ISSUES];
  if (issueQuery.severity) issues = issues.filter((i) => i.severity === issueQuery.severity);
  if (issueQuery.issueType) issues = issues.filter((i) => i.issueType === issueQuery.issueType);
  if (issueQuery.state) issues = issues.filter((i) => i.state === issueQuery.state);
  const limit = issueQuery.limit ?? issues.length;
  return mockIssueResponse(issues.slice(0, limit));
};

export const createGetIssueQueryOptions = (
  issueQuery: IssueQuery,
  options: Omit<ReactQueryOptions<IssueResponse>, 'queryKey' | 'queryFn'> = {},
) => {
  return {
    queryKey: [PLUGIN_KITE, issueQuery],
    queryFn: isDeveloperMockMode()
      ? () => Promise.resolve(mockFetchIssues(issueQuery))
      : () => fetchIssues(issueQuery),
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
