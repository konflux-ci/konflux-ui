import { global_danger_color_100 as redColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_palette_black_400 as grayColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_gold_400 as goldColor } from '@patternfly/react-tokens/dist/js/global_palette_gold_400';
import { global_palette_orange_300 as orangeColor } from '@patternfly/react-tokens/dist/js/global_palette_orange_300';
import { global_success_color_100 as greenColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';

const DEFAULT_FAVICON_HREF = '/favicon.ico';

let activeConsumers = 0;
let baselineFaviconHref: string | null = null;

const readFaviconHref = (): string => {
  const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  return link?.href || DEFAULT_FAVICON_HREF;
};

export const getFaviconLink = (): HTMLLinkElement => {
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
};

const resetToBaselineFavicon = (): void => {
  getFaviconLink().href = baselineFaviconHref ?? DEFAULT_FAVICON_HREF;
};

export const getFaviconBadgeColor = (status: string): string => {
  switch (status) {
    case 'Succeeded':
      return greenColor.value;
    case 'Failed':
    case 'FailedToStart':
    case 'Test Failures':
      return redColor.value;
    case 'Running':
    case 'In Progress':
      return blueColor.value;
    case 'Cancelled':
    case 'Cancelling':
      return goldColor.value;
    case 'Test Warnings':
      return warningColor.value;
    case 'Starting':
      return orangeColor.value;
    case 'Idle':
    case 'Pending':
    case 'Skipped':
    case 'Unknown':
    case 'PR needs merge':
    default:
      return grayColor.value;
  }
};

/** Acquire shared favicon ownership for a consumer (e.g. a React effect). */
export const acquireFaviconBadge = (): void => {
  if (activeConsumers === 0) {
    baselineFaviconHref = readFaviconHref();
  }
  activeConsumers += 1;
};

/** Release shared favicon ownership; restores baseline only when the last consumer exits. */
export const releaseFaviconBadge = (): void => {
  if (activeConsumers === 0) {
    return;
  }

  activeConsumers -= 1;
  if (activeConsumers === 0) {
    resetToBaselineFavicon();
    baselineFaviconHref = null;
  }
};

/** Resets ownership state between unit tests. */
export const resetFaviconBadgeStateForTests = (): void => {
  activeConsumers = 0;
  baselineFaviconHref = null;
};

export const setFaviconHref = (href: string): void => {
  getFaviconLink().href = href;
};

export const compositeFaviconWithBadge = (
  baseImage: HTMLImageElement,
  badgeColor: string,
): string | null => {
  const size = baseImage.naturalWidth || baseImage.width || 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.drawImage(baseImage, 0, 0, size, size);

  const badgeRadius = size * 0.17;
  const badgeX = size - badgeRadius - 1;
  const badgeY = size - badgeRadius - 1;

  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = badgeColor;
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

const loadFaviconImage = (href: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load favicon image: ${href}`));
    img.src = href;
  });

export const applyFaviconBadge = async (
  status: string | null | undefined,
  isCancelled?: () => boolean,
): Promise<void> => {
  if (!status) {
    if (activeConsumers > 0) {
      resetToBaselineFavicon();
    }
    return;
  }

  const badgeColor = getFaviconBadgeColor(status);
  const baseHref = baselineFaviconHref ?? readFaviconHref();

  try {
    const img = await loadFaviconImage(baseHref);
    if (isCancelled?.()) {
      return;
    }

    const dataUrl = compositeFaviconWithBadge(img, badgeColor);
    if (dataUrl && !isCancelled?.()) {
      setFaviconHref(dataUrl);
    } else if (!dataUrl && !isCancelled?.()) {
      resetToBaselineFavicon();
    }
  } catch {
    if (!isCancelled?.()) {
      resetToBaselineFavicon();
    }
  }
};
