import * as React from 'react';
import { ImageRepositoryLabel } from '~/consts/imagerepo';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { useK8sWatchResource } from '~/k8s';
import { ComponentModel, ImageRepositoryGroupVersionKind, ImageRepositoryModel } from '~/models';
import { ImageRepositoryKind } from '~/types';

export const useImageRepository = (
  namespace: string | null,
  componentName: string | null,
  applicationName?: string | null,
  watch?: boolean,
): [ImageRepositoryKind | null, boolean, unknown] => {
  const { isImageControllerEnabled } = useIsImageControllerEnabled();
  const shouldFetch = Boolean(isImageControllerEnabled && namespace && componentName);

  const matchLabels = applicationName
    ? { [ImageRepositoryLabel.APPLICATION]: applicationName }
    : { [ImageRepositoryLabel.COMPONENT]: componentName };

  const {
    data: imageRepositories,
    isLoading,
    error,
  } = useK8sWatchResource<ImageRepositoryKind[]>(
    shouldFetch
      ? {
          groupVersionKind: ImageRepositoryGroupVersionKind,
          namespace,
          isList: true,
          selector: { matchLabels },
          watch,
        }
      : undefined,
    ImageRepositoryModel,
  );

  const imageRepository = React.useMemo(
    () =>
      imageRepositories?.find((repo) =>
        repo.metadata?.ownerReferences?.some(
          (ref) => ref.kind === ComponentModel.kind && ref.name === componentName,
        ),
      ) ?? null,
    [imageRepositories, componentName],
  );

  return React.useMemo(() => {
    if (!shouldFetch) {
      return [null, true, undefined];
    }

    if (isLoading) {
      return [null, false, null];
    }

    if (imageRepository) {
      return [imageRepository, true, null];
    }

    return [null, true, error];
  }, [shouldFetch, isLoading, imageRepository, error]);
};
