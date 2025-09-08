import React from 'react';
import { useK8sWatchResource, k8sQueryGetResource } from '../k8s';
import { TQueryOptions } from '../k8s/query/type';
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

/**
 * Utility function to fetch Konflux public information from ConfigMap.
 * Uses k8sQueryGetResource to get the 'konflux-public-info' ConfigMap
 * from the 'konflux-info' namespace and parses the info.json data.
 *
 * This is an alternative to the useKonfluxPublicInfo hook when you need
 * to fetch the data imperatively rather than as part of a component's lifecycle.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const info = await getKonfluxPublicInfo();
 * console.log(info.environment); // 'staging' | 'production'
 *
 * // With query options
 * const info = await getKonfluxPublicInfo({
 *   staleTime: 60000 // Cache for 1 minute
 * });
 * ```
 *
 * @param options - Optional React Query configuration options
 * @returns Promise<KonfluxPublicInfo> - The parsed public information
 * @throws Error if the resource cannot be fetched or parsed
 */
export const getKonfluxPublicInfo = async (
  options?: TQueryOptions<KonfluxPublicInfoConfigMap>,
): Promise<KonfluxPublicInfo> => {
  const configMap = await k8sQueryGetResource<KonfluxPublicInfoConfigMap>(
    {
      model: ConfigMapModel,
      queryOptions: {
        name: 'konflux-public-info',
        ns: 'konflux-info',
      },
    },
    options,
  );

  if (!configMap?.data?.['info.json']) {
    throw new Error('info.json not found in konflux-public-info ConfigMap');
  }

  try {
    return JSON.parse(configMap.data['info.json']);
  } catch (error) {
    throw new Error(
      `Failed to parse info.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};
