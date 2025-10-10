import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { IssueQuery } from './issue-type';
import { createGetIssueQueryOptions, createInfiniteIssueQueryOptions } from './kite-query';

export const useIssues = (issueQuery: IssueQuery) => {
  // const { isKiteServiceEnabled } = useIsKiteServiceEnabled();

  // return useQuery(createGetIssueQueryOptions(issueQuery, {enabled: isKiteServiceEnabled}));
  return useQuery(createGetIssueQueryOptions(issueQuery));
};

export const useInfiniteIssues = (issueQuery: IssueQuery) => {
  // const { isKiteServiceEnabled } = useIsKiteServiceEnabled();

  // return useInfiniteQuery(createInfiniteIssueQueryOptions(issueQuery, {enabled: isKiteServiceEnabled}));
  return useInfiniteQuery(createInfiniteIssueQueryOptions(issueQuery));
};
