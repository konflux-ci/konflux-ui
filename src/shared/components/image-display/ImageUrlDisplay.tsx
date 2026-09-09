import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { CopyIconButton } from '~/shared/components/CopyIconButton';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { ImageRepositoryVisibility } from '~/types';
import { getImageUrlForVisibility } from '~/utils/component-utils';

export interface ImageUrlDisplayProps {
  /** Original image URL */
  imageUrl: string;
  /** Component namespace */
  namespace: string;
  /** Component name */
  componentName: string;
  /** Application name */
  applicationName?: string;
}

const getContainerImageLink = (url: string) => {
  const imageUrl = url.includes('@sha') ? url.split('@sha')[0] : url;
  return imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
};

export const ImageUrlDisplay: React.FC<ImageUrlDisplayProps> = ({
  imageUrl,
  namespace,
  componentName,
  applicationName,
}) => {
  const { isImageControllerEnabled } = useIsImageControllerEnabled();
  const [urlInfo, proxyLoaded, proxyError] = useImageProxy();
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    namespace,
    componentName,
    applicationName,
    false,
  );

  const visibility = isImageControllerEnabled
    ? (imageRepository?.spec?.image?.visibility ?? null)
    : null;
  const isPrivate = visibility === ImageRepositoryVisibility.private;

  // When image controller is disabled, skip loading states for image repo/proxy
  // and display the raw image URL directly
  if (
    isImageControllerEnabled &&
    ((!imageRepoLoaded && !imageRepoError) || (isPrivate && !proxyLoaded && !proxyError))
  ) {
    return <Skeleton aria-label="Loading image URL" />;
  }

  if (isPrivate) {
    const displayImageUrl =
      getImageUrlForVisibility(
        imageUrl,
        visibility,
        proxyError || !urlInfo ? null : urlInfo.hostname,
      ) || imageUrl;
    return (
      <>
        <ExternalLink
          href={getContainerImageLink(displayImageUrl)}
          text={displayImageUrl}
          style={{ userSelect: 'auto' }}
        />
        <CopyIconButton text={displayImageUrl} />
      </>
    );
  }

  return (
    <>
      <ExternalLink
        href={getContainerImageLink(imageUrl)}
        text={imageUrl}
        style={{ userSelect: 'auto' }}
      />
      <CopyIconButton text={imageUrl} />
    </>
  );
};
