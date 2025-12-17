import * as React from 'react';
import { ClipboardCopy, Skeleton } from '@patternfly/react-core';
import { useImageProxyHost } from '~/hooks/useImageProxyHost';
import { useImageRepository } from '~/hooks/useImageRepository';
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
  /** Whether the external link should be selectable as highlighted text */
  isHighlightable?: boolean;
}

/**
 * Default formatter — ensures URL starts with https://
 */
const getContainerImageLink = (url: string) => {
  const imageUrl = url.includes('@sha') ? url.split('@sha')[0] : url;
  return imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
};

/**
 * Renders an image URL using:
 * - `ClipboardCopy` for private images (shows proxy URL when available, original URL as fallback)
 * - `ExternalLink` for public or unspecified visibility
 * - `Skeleton` while loading image repository or proxy host information
 *
 * Uses dynamic proxy host and visibility from Konflux public info and image repository.
 */
export const ImageUrlDisplay: React.FC<ImageUrlDisplayProps> = ({
  imageUrl,
  namespace,
  componentName,
  isHighlightable = false,
}) => {
  const [proxyHost, proxyHostLoaded, proxyHostError] = useImageProxyHost();
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    namespace,
    componentName,
    false,
  );

  const visibility = imageRepository?.spec?.image?.visibility ?? null;
  const isPrivate = visibility === ImageRepositoryVisibility.private;

  // Show loading while fetching data (only if no error)
  // Once error occurs, fallback to display the content
  if ((!imageRepoLoaded && !imageRepoError) || (isPrivate && !proxyHostLoaded && !proxyHostError)) {
    return <Skeleton aria-label="Loading image URL" />;
  }

  if (isPrivate) {
    // If proxyHost has error, fallback to original URL
    const displayImageUrl = getImageUrlForVisibility(
      imageUrl,
      visibility,
      proxyHostError ? null : proxyHost,
    );
    return (
      <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" variant="inline-compact">
        {displayImageUrl}
      </ClipboardCopy>
    );
  }

  return (
    <ExternalLink
      href={getContainerImageLink(imageUrl)}
      text={imageUrl}
      isHighlightable={isHighlightable}
    />
  );
};
