import * as React from 'react';
import { useK8sWatchResource } from '../k8s';
import { ApplicationGroupVersionKind, ApplicationModel } from '../models';
import { ApplicationKind } from '../types';

export const useApplications = (namespace: string): [ApplicationKind[], boolean, unknown] => {
  const {
    data: applications,
    isLoading,
    error,
  } = useK8sWatchResource<ApplicationKind[]>(
    {
      groupVersionKind: ApplicationGroupVersionKind,
      namespace,
      isList: true,
    },
    ApplicationModel,
    {
      filterData: (resource) =>
        resource?.filter(
          (application: ApplicationKind) => !application.metadata?.deletionTimestamp,
        ) ?? [],
    },
  );
  return [applications, !isLoading, error];
};

export const useApplication = (
  namespace: string,
  workspace: string,
  applicationName: string,
): [ApplicationKind, boolean, unknown] => {
  const {
    data: application,
    isLoading,
    error,
  } = useK8sWatchResource<ApplicationKind>(
    {
      groupVersionKind: ApplicationGroupVersionKind,
      name: applicationName,
      namespace,
      workspace,
    },
    ApplicationModel,
  );

  return React.useMemo(() => {
    if (
      !isLoading &&
      !error &&
      (application as unknown as ApplicationKind).metadata?.deletionTimestamp
    ) {
      return [null, !isLoading, { code: 404 }];
    }
    return [application, !isLoading as unknown as boolean, error as unknown];
  }, [application, isLoading, error]);
};
