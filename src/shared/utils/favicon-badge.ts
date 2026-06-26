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
  color: string,
  isCancelled?: () => boolean,
): Promise<void> => {
  const baseHref = baselineFaviconHref ?? readFaviconHref();

  try {
    const img = await loadFaviconImage(baseHref);
    if (isCancelled?.()) {
      return;
    }

    const dataUrl = compositeFaviconWithBadge(img, color);
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
