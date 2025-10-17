import { useState, useEffect } from 'react';
import { commonFetch } from '~/k8s/fetch';
import { IssuesApiResponse, IssuesApiParams } from '~/types/issues';

/**
 * Fetch issues from the API
 */
const fetchIssues = async (params: IssuesApiParams): Promise<IssuesApiResponse> => {
  const { namespace, severity, issueType, state = 'ACTIVE', limit = 10, offset = 0 } = params;

  const searchParams = new URLSearchParams();
  if (namespace) searchParams.append('namespace', namespace);
  if (severity) searchParams.append('severity', severity);
  if (issueType) searchParams.append('issueType', issueType);
  if (state) searchParams.append('state', state);
  searchParams.append('limit', limit.toString());
  searchParams.append('offset', offset.toString());

  const url = `/api/v1/issues?${searchParams.toString()}`;
  const response = await commonFetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch issues: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Hook to fetch issues with filtering and pagination
 */
export const useIssues = (
  params: IssuesApiParams = {},
): [IssuesApiResponse | undefined, boolean, Error | undefined] => {
  const [data, setData] = useState<IssuesApiResponse | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let isCancelled = false;

    const loadIssues = async () => {
      try {
        setLoading(true);
        setError(undefined);

        const result = await fetchIssues(params);

        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
          setData(undefined);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadIssues();

    return () => {
      isCancelled = true;
    };
  }, [params]);

  return [data, !loading, error];
};

export const useLatestIssues = (
  namespace?: string,
  limit = 5,
): [IssuesApiResponse | undefined, boolean, Error | undefined] => {
  return useIssues({
    namespace,
    state: 'ACTIVE',
    limit,
  });
};
