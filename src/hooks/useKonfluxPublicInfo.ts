import React from 'react';
import { useK8sWatchResource } from '../k8s';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '../models';
import { KonfluxPublicInfo, KonfluxPublicInfoConfigMap } from '../types/konfluxPublicInfo';

export const useKonfluxPublicInfo = (watch?: boolean): [KonfluxPublicInfo, boolean, unknown] => {
  const {
    data: configMap,
    isLoading: configMapLoading,
    error,
  } = useK8sWatchResource<KonfluxPublicInfoConfigMap>(
    {
      groupVersionKind: ConfigMapGroupVersionKind,
      namespace: 'konflux-info',
      name: 'konflux-public-info',
      watch,
    },
    ConfigMapModel,
  );

  // Memoize the result of info.json for performance
  const parsedData: KonfluxPublicInfo = React.useMemo(() => {
    return !configMapLoading && !error && configMap?.data
      ? JSON.parse(configMap.data['info.json'])
      : {};
  }, [configMap, configMapLoading, error]);

  return [parsedData, configMapLoading, error];
};
