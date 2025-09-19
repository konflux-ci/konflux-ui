import { useK8sWatchResource } from '~/k8s';
import { IssueGroupVersionKind, IssueModel } from '~/models/issue';
import { IssueKind } from '../../types';

export const useIssues = (namespace: string): [IssueKind[], boolean, unknown] => {
  const {
    data: issues,
    isLoading,
    error,
  } = useK8sWatchResource<IssueKind[]>(
    {
      groupVersionKind: IssueGroupVersionKind,
      namespace,
      isList: true,
    },
    IssueModel,
    // {},
    // { pathPrefix: "issues" },
  );

  return [issues, !isLoading, error];
};
