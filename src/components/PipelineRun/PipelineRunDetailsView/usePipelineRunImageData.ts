import * as React from 'react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { PipelineRunKind } from '~/types';
import { ImageRepositoryVisibility } from '~/types/image-repository';
import { getImageUrlForVisibility } from '~/utils/component-utils';
import {
  getPipelineRunStatusResultForName,
  getPipelineRunStatusResults,
} from '~/utils/pipeline-utils';

const addProxyUrlParamValue = <T extends { name: string; value: string | string[] }>(
  items: T[] | undefined | null,
  paramName: string,
  visibility: ImageRepositoryVisibility,
  proxyHost: string | null | undefined,
): T[] | null | undefined => {
  if (!items || visibility !== ImageRepositoryVisibility.private) {
    return items;
  }
  return items.flatMap((r) => {
    if (r.name !== paramName || typeof r.value !== 'string') {
      return r;
    }
    const proxyUrl = getImageUrlForVisibility(r.value, visibility, proxyHost ?? null);
    if (proxyUrl == null || proxyUrl === r.value) {
      return [r];
    }
    return [r, { ...r, name: `${paramName} (via access proxy)`, value: proxyUrl }];
  });
};

export const usePipelineRunImageData = (pipelineRun: PipelineRunKind, namespace: string) => {
  const { isImageControllerEnabled } = useIsImageControllerEnabled();
  const componentName = pipelineRun?.metadata?.labels?.[PipelineRunLabel.COMPONENT];
  const [urlInfo, imageProxyLoaded, proxyError] = useImageProxy();
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    namespace,
    componentName,
    null,
    false,
  );

  const results = getPipelineRunStatusResults(pipelineRun);
  const patchedResultsForProxy = React.useMemo(
    () =>
      isImageControllerEnabled &&
      imageProxyLoaded &&
      imageRepoLoaded &&
      !!imageRepository?.spec?.image?.visibility
        ? addProxyUrlParamValue(
            results,
            'IMAGE_URL',
            imageRepository.spec.image.visibility,
            urlInfo?.hostname,
          )
        : results,
    [
      isImageControllerEnabled,
      imageProxyLoaded,
      imageRepoLoaded,
      imageRepository?.spec.image?.visibility,
      results,
      urlInfo?.hostname,
    ],
  );
  const specParams = pipelineRun?.spec?.params;
  const patchedSpecParamsForProxy = React.useMemo(
    () =>
      isImageControllerEnabled &&
      imageProxyLoaded &&
      imageRepoLoaded &&
      !!imageRepository?.spec?.image?.visibility
        ? addProxyUrlParamValue(
            specParams,
            'output-image',
            imageRepository.spec.image.visibility,
            urlInfo?.hostname,
          )
        : specParams,
    [
      isImageControllerEnabled,
      imageProxyLoaded,
      imageRepoLoaded,
      imageRepository?.spec.image?.visibility,
      specParams,
      urlInfo?.hostname,
    ],
  );

  const buildImage =
    pipelineRun?.metadata?.annotations?.[PipelineRunLabel.BUILD_IMAGE_ANNOTATION] ||
    getPipelineRunStatusResultForName(`IMAGE_URL`, pipelineRun)?.value;

  const displayImageUrl = isImageControllerEnabled
    ? getImageUrlForVisibility(
        buildImage,
        imageRepository?.spec?.image?.visibility ?? null,
        proxyError || imageRepoError || !urlInfo ? null : urlInfo.hostname,
      )
    : (buildImage ?? null);

  return React.useMemo(
    () => ({
      results: patchedResultsForProxy,
      params: patchedSpecParamsForProxy,
      imageUrl: displayImageUrl,
    }),
    [patchedResultsForProxy, patchedSpecParamsForProxy, displayImageUrl],
  );
};
