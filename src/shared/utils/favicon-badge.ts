const DEFAULT_FAVICON_HREF = '/favicon.ico';

/** Last non-badged favicon href. Needed when navigating between status pages while a data-URL badge is still applied. */
let rememberedBaselineHref: string | undefined;

export const readFaviconHref = (): string => {
  const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  return link?.href || DEFAULT_FAVICON_HREF;
};

/**
 * Returns the original (non-badged) favicon href to restore to.
 * Skips data: URLs left by a previous page's badge so chained detail → list
 * navigations do not "restore" a badged favicon.
 */
export const getFaviconBaselineHref = (): string => {
  const current = readFaviconHref();
  if (!current.startsWith('data:')) {
    rememberedBaselineHref = current;
    return current;
  }
  return rememberedBaselineHref ?? DEFAULT_FAVICON_HREF;
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

export const setFaviconHref = (href: string): void => {
  getFaviconLink().href = href;
};

export const restoreFaviconHref = (href?: string): void => {
  setFaviconHref(href ?? DEFAULT_FAVICON_HREF);
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

  const badgeRadius = size * 0.2;
  const badgeX = size - badgeRadius - size * 0.04;
  const badgeY = size - badgeRadius - size * 0.04;

  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = badgeColor;
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.stroke();

  return canvas.toDataURL('image/png');
};

const isSameOriginHref = (href: string): boolean => {
  try {
    return new URL(href, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
};

const loadFaviconImage = (href: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (!href.startsWith('data:') && !isSameOriginHref(href)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load favicon image: ${href}`));
    img.src = href;
  });

export const applyFaviconBadge = async (
  color: string,
  baseHref: string,
  isCancelled?: () => boolean,
): Promise<void> => {
  try {
    const img = await loadFaviconImage(baseHref);
    if (isCancelled?.()) {
      return;
    }

    const dataUrl = compositeFaviconWithBadge(img, color);
    if (dataUrl && !isCancelled?.()) {
      setFaviconHref(dataUrl);
    }
  } catch {
    restoreFaviconHref(baseHref);
  }
};
