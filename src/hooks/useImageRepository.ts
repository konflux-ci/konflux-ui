import * as React from 'react';
import { ImageRepositoryLabel } from '~/consts/imagerepo';
import { useK8sWatchResource } from '~/k8s';
import { ComponentModel, ImageRepositoryGroupVersionKind, ImageRepositoryModel } from '~/models';
import { ImageRepositoryKind } from '~/types';

export const useImageRepository = (
  namespace: string | null,
  componentName: string | null,
  applicationName?: string | null,
  watch?: boolean,
): [ImageRepositoryKind | null, boolean, unknown] => {
  const enabled = Boolean(namespace && componentName);

  const matchLabels = applicationName
    ? { [ImageRepositoryLabel.APPLICATION]: applicationName }
    : { [ImageRepositoryLabel.COMPONENT]: componentName };

  const {
    data: imageRepositories,
    isLoading,
    error,
  } = useK8sWatchResource<ImageRepositoryKind[]>(
    enabled
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
    if (!enabled) {
      return [null, true, undefined];
    }

    if (isLoading) {
      return [null, false, null];
    }

    if (imageRepository) {
      return [imageRepository, true, null];
    }

    return [null, true, error];
  }, [enabled, isLoading, imageRepository, error]);
};
