import React from 'react';
import { useK8sWatchResource } from '../k8s/hooks/useK8sWatchResource';
import { ApplicationGroupVersionKind, ApplicationModel } from '../models';
import { ApplicationKind } from '../types';

export const useApplications = (
  namespace: string,
  workspace: string,
): [ApplicationKind[], boolean, unknown] => {
  const {
    data: applications,
    isLoading,
    error,
  } = useK8sWatchResource(
    {
      groupVersionKind: ApplicationGroupVersionKind,
      namespace,
      workspace,
      isList: true,
    },
    ApplicationModel,
  );

  return React.useMemo(
    () => [
      (applications as unknown as ApplicationKind[]).filter(
        (application: ApplicationKind) => !application.metadata?.deletionTimestamp,
      ),
      !isLoading,
      error,
    ],
    [applications, isLoading, error],
  );
};

// export const useApplication = (
//   namespace: string,
//   applicationName: string,
// ): [ApplicationKind, boolean, unknown] => {
//   const {data: application, isLoading, error} = useK8sWatchResource({
//     groupVersionKind: ApplicationGroupVersionKind,
//     name: applicationName,
//     namespace,
//   }, ApplicationModel);

//   return React.useMemo(() => {
//     if (isLoading && !error && (application as unknown as ApplicationKind).metadata?.deletionTimestamp) {
//       return [null, isLoading, { code: 404 }];
//     }
//     return [application, isLoading as unknown as boolean, error as unknown];
//   }, [application, isLoading, error]);
// };
