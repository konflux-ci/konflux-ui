import * as React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
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
}

const getContainerImageLink = (url: string) => {
  const imageUrl = url.includes('@sha') ? url.split('@sha')[0] : url;
  return imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
};

export const ImageUrlDisplay: React.FC<ImageUrlDisplayProps> = ({
  imageUrl,
  namespace,
  componentName,
}) => {
  const [urlInfo, proxyLoaded, proxyError] = useImageProxy();
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    namespace,
    componentName,
    false,
  );

  const visibility = imageRepository?.spec?.image?.visibility ?? null;
  const isPrivate = visibility === ImageRepositoryVisibility.private;

  // Show loading while fetching data (only if no error)
  // Once error occurs, fallback to display the content
  if ((!imageRepoLoaded && !imageRepoError) || (isPrivate && !proxyLoaded && !proxyError)) {
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
