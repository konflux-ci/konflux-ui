import * as React from 'react';
import { ImageRepositoryLabel } from '~/consts/imagerepo';
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
  const enabled = Boolean(namespace && componentName);

  /**
   * try to get by name
   */
  const {
    data: imageRepository,
    isLoading: isPrimaryLoading,
    error: primaryError,
  } = useK8sWatchResource<ImageRepositoryKind>(
    enabled
      ? {
          groupVersionKind: ImageRepositoryGroupVersionKind,
          namespace,
          name: componentName,
          watch,
        }
      : undefined,
    ImageRepositoryModel,
  );

  /**
   * if the first try fails, try labels
   */
  const shouldTryLabel = enabled && !isPrimaryLoading && !!primaryError;

  const {
    data: imageRepositories,
    isLoading: isFallbackLoading,
    error: fallbackError,
  } = useK8sWatchResource<ImageRepositoryKind[]>(
    shouldTryLabel
      ? {
          groupVersionKind: ImageRepositoryGroupVersionKind,
          namespace,
          isList: true,
          selector: {
            matchLabels: {
              [ImageRepositoryLabel.COMPONENT]: componentName,
            },
          },
          watch,
        }
      : undefined,
    ImageRepositoryModel,
  );

  return React.useMemo(() => {
    // primary success
    if (imageRepository) {
      return [imageRepository, true, null];
    }

    // fallback success
    if (imageRepositories?.length) {
      return [imageRepositories[0], true, null];
    }

    // still loading
    if (isPrimaryLoading || (shouldTryLabel && isFallbackLoading)) {
      return [null, false, null];
    }

    // both failed
    return [null, true, primaryError || fallbackError];
  }, [
    imageRepository,
    imageRepositories,
    isPrimaryLoading,
    isFallbackLoading,
    primaryError,
    fallbackError,
    shouldTryLabel,
  ]);
};
