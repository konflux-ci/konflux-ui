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
  /** Custom formatter for external link URLs */
  formatLinkUrl?: (url: string) => string;
  /** Whether the external link should be selectable as highlighted text */
  isHighlightable?: boolean;
  /** Additional style overrides for the external link */
  linkStyle?: React.CSSProperties;
}

/**
 * Default formatter — ensures URL starts with https://
 */
const defaultFormatLinkUrl = (url: string): string =>
  url.startsWith('http') ? url : `https://${url}`;

/**
 * Renders an image URL using:
 * - `ClipboardCopy` for private images (shows proxy URL when available, original URL as fallback)
 * - `ExternalLink` for public or unspecified visibility
 * - `Skeleton` while loading image repository or proxy host information
 *
 * Optional `formatLinkUrl` allows custom registry URL rewriting.
 * Uses dynamic proxy host and visibility from Konflux public info and image repository.
 */
export const ImageUrlDisplay: React.FC<ImageUrlDisplayProps> = ({
  imageUrl,
  namespace,
  componentName,
  formatLinkUrl = defaultFormatLinkUrl,
  isHighlightable = false,
  linkStyle,
}) => {
  const [proxyHost, proxyHostLoaded] = useImageProxyHost();
  const [imageRepository, imageRepoLoaded] = useImageRepository(namespace, componentName, false);

  const visibility = imageRepository?.spec?.image?.visibility ?? null;
  const isPrivate = visibility === ImageRepositoryVisibility.private;

  // Show loading while fetching data
  if (!imageRepoLoaded || (isPrivate && !proxyHostLoaded)) {
    return <Skeleton aria-label="Loading image URL" />;
  }

  if (isPrivate) {
    const displayUrl = getImageUrlForVisibility(imageUrl, visibility, proxyHost);
    return (
      <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" variant="inline-compact">
        {displayUrl}
      </ClipboardCopy>
    );
  }

  return (
    <ExternalLink
      href={formatLinkUrl(imageUrl)}
      text={imageUrl}
      isHighlightable={isHighlightable}
      style={linkStyle}
    />
  );
};
