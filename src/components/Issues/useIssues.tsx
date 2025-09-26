import * as React from 'react';
import { commonFetchJSON, getQueryString } from '~/k8s';
import { IssueKind, IssueQuery } from '~/types';

// const testFullQuery: IssueQuery = {
//   namespace: 'sbudhwar-1-tenant',
//   severity: IssueSeverity.CRITICAL,
//   issueType: IssueType.DEPENDENCY,
//   state: IssueState.ACTIVE,
//   resourceType: 'Deployment',
//   resourceName: 'demo-app',
//   search: 'failed to pull image',
//   limit: 100,
//   offset: 25,
// };

const testBasicQuery: IssueQuery = {
  namespace: 'sbudhwar-1-tenant',
  limit: 100,
  offset: 25,
};

export const useIssueQuery = (resourcePath: string): [IssueKind[], boolean, string] => {
  const [data, setData] = React.useState<IssueKind[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await commonFetchJSON<IssueKind[]>(resourcePath, {
          pathPrefix: 'plugins/kite',
        });
        setData(response);
      } catch (err) {
        setError('An unknown error occurred while fetching issues.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [resourcePath]);

  return [data, loading, error];
};

// export const useIssues = (issueQuery: IssueQuery): [IssueKind[], boolean, string] => {
export const useIssues = (): [IssueKind[], boolean, string] => {
  const api = `/api/v1/issues?`;
  // const options = getQueryString(issueQuery);  MAIN
  // const options = getQueryString(testFullQuery);
  const options = getQueryString(testBasicQuery);
  const resourcePath = api + options;

  return useIssueQuery(resourcePath);
};
