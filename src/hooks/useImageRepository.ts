import * as React from 'react';
import { useK8sWatchResource } from '../k8s';
import { ImageRepositoryGroupVersionKind, ImageRepositoryModel } from '../models';
import { ImageRepositoryKind } from '../types';

/**
 * Hook to fetch and watch an ImageRepository resource for a component
 * @param namespace - The namespace where the ImageRepository exists
 * @param componentName - The component name (ImageRepository has the same name as the component)
 * @param watch - Whether to watch for updates (default: false)
 * @returns [imageRepository, loaded, error]
 */
export const useImageRepository = (
  namespace: string,
  componentName: string,
  watch?: boolean,
): [ImageRepositoryKind, boolean, unknown] => {
  const {
    data: imageRepository,
    isLoading,
    error,
  } = useK8sWatchResource<ImageRepositoryKind>(
    componentName
      ? {
          groupVersionKind: ImageRepositoryGroupVersionKind,
          namespace,
          name: componentName,
          watch,
        }
      : undefined,
    ImageRepositoryModel,
  );

  return React.useMemo(() => {
    if (!isLoading && !error && imageRepository?.metadata.deletionTimestamp) {
      return [null, !isLoading, { code: 404 }];
    }
    return [imageRepository, !isLoading, error];
  }, [imageRepository, isLoading, error]);
};
