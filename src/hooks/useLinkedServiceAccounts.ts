import { useMemo } from 'react';
import { filterLinkedServiceAccounts } from '~/components/Secrets/utils/service-account-utils';
import { LINKING_STATUS_ANNOTATION } from '~/consts/secrets';
import { useK8sWatchResource } from '~/k8s';
import { ServiceAccountGroupVersionKind, ServiceAccountModel } from '~/models';
import { SecretKind, ServiceAccountKind } from '~/types';
import { BackgroundJobStatus } from '~/utils/task-store';

export const useLinkedServiceAccounts = (namespace: string, secert: SecretKind, watch: boolean) => {
  const {
    data: serviceAccounts,
    isLoading,
    error,
  } = useK8sWatchResource<ServiceAccountKind[]>(
    {
      groupVersionKind: ServiceAccountGroupVersionKind,
      // the name field is used to refresh status when annotations is updating.
      name: secert.metadata?.annotations?.[LINKING_STATUS_ANNOTATION],
      namespace,
      isList: true,
      watch,
    },
    ServiceAccountModel,
  );

  const linkedServiceAccounts: ServiceAccountKind[] = useMemo(() => {
    if (isLoading || !serviceAccounts) return [];
    const taskStatus = secert.metadata?.annotations?.[LINKING_STATUS_ANNOTATION];
    const isFinished = [BackgroundJobStatus.Succeeded, BackgroundJobStatus.Failed].includes(
      taskStatus as BackgroundJobStatus,
    );
    if (!isFinished) {
      return [];
    }
    return filterLinkedServiceAccounts(secert.metadata?.name, serviceAccounts);
  }, [secert, serviceAccounts, isLoading]);

  return {
    linkedServiceAccounts,
    isLoading,
    error,
  };
};
