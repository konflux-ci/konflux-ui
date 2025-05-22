import { useMemo } from 'react';
import { filterLinkedServiceAccounts } from '~/components/Secrets/utils/service-account-utils';
import { useK8sWatchResource } from '~/k8s';
import { ServiceAccountGroupVersionKind, ServiceAccountModel } from '~/models';
import { ServiceAccountKind } from '~/types';

export const useLinkedServiceAccounts = (namespace: string, secretName: string, watch: boolean) => {
  const {
    data: serviceAccounts,
    isLoading,
    error,
  } = useK8sWatchResource<ServiceAccountKind[]>(
    {
      groupVersionKind: ServiceAccountGroupVersionKind,
      namespace,
      isList: true,
      watch,
    },
    ServiceAccountModel,
  );

  const linkedServiceAccounts: ServiceAccountKind[] = useMemo(() => {
    if (isLoading || !serviceAccounts) return [];
    return filterLinkedServiceAccounts(secretName, serviceAccounts);
  }, [secretName, serviceAccounts, isLoading]);

  return {
    linkedServiceAccounts,
    isLoading,
    error,
  };
};
