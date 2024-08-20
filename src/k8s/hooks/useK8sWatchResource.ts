import { useQuery } from '@tanstack/react-query';
import { createQueryFunction, createQueryKeys } from '../query/utils';
import { K8sModelCommon, WatchK8sResource } from '../../types/k8s';
import { convertToK8sQueryParams } from '../k8s-utils';

export const useK8sWatchResource = (resourceInit: WatchK8sResource, model: K8sModelCommon) => {
  const queryKey = createQueryKeys(
    resourceInit.groupVersionKind,
    resourceInit.workspace,
    resourceInit.name,
  );
  const queryOptions = convertToK8sQueryParams(resourceInit);
  return useQuery({
    queryKey,
    queryFn: createQueryFunction(resourceInit.isList)({ model, queryOptions }),
  });
};
