import React from 'react';
import { useK8sWatchResource } from '../k8s';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '../models';
import { KonfluxPublicInfo, KonfluxPublicInfoConfigMap } from '../types/konflux-public-info';

export const useKonfluxPublicInfo = (): [KonfluxPublicInfo, boolean, unknown] => {
  const {
    data: configMap,
    isLoading: isLoading,
    error,
  } = useK8sWatchResource<KonfluxPublicInfoConfigMap>(
    {
      groupVersionKind: ConfigMapGroupVersionKind,
      namespace: 'konflux-info',
      name: 'konflux-public-info',
    },
    ConfigMapModel,
  );

  // Memoize the result of info.json for performance
  const parsedData: KonfluxPublicInfo = React.useMemo(() => {
    return !isLoading && !error && configMap?.data ? JSON.parse(configMap.data['info.json']) : {};
  }, [configMap, isLoading, error]);

  return [parsedData, !isLoading, error];
};
