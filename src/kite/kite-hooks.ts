import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { IssueQuery } from './issue-type';
import { createGetIssueQueryOptions, createInfiniteIssueQueryOptions } from './kite-query';

export const useIssues = (issueQuery: IssueQuery) => {
  return useQuery(createGetIssueQueryOptions(issueQuery));
};

export const useInfiniteIssues = (issueQuery: IssueQuery) => {
  return useInfiniteQuery(createInfiniteIssueQueryOptions(issueQuery));
};
