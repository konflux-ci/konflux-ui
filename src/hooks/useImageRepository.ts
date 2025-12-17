import * as React from 'react';
import { useK8sWatchResource } from '~/k8s';
import { ImageRepositoryGroupVersionKind, ImageRepositoryModel } from '~/models';
import { ImageRepositoryKind } from '~/types';

/**
 * Hook to fetch and watch an ImageRepository resource for a component
 * @param namespace - The namespace where the ImageRepository exists (or null to skip fetch)
 * @param componentName - The component name (ImageRepository has the same name as the component, or null to skip fetch)
 * @param watch - Whether to watch for updates (default: false)
 * @returns [imageRepository, loaded, error]
 */
export const useImageRepository = (
  namespace: string | null,
  componentName: string | null,
  watch?: boolean,
): [ImageRepositoryKind | null, boolean, unknown] => {
  const {
    data: imageRepository,
    isLoading,
    error,
  } = useK8sWatchResource<ImageRepositoryKind>(
    namespace && componentName
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
    return [imageRepository ?? null, !isLoading, error];
  }, [imageRepository, isLoading, error]);
};
