import { useKonfluxPublicInfo } from './useKonfluxPublicInfo';

export type ImageProxyUrlInfo = {
  /** Full URL with protocol (e.g., "https://example.com:8080") */
  fullUrl: string;
  /** Hostname without port (e.g., "example.com") */
  hostname: string;
  /** OAuth path from config (e.g., "/oauth") */
  oauthPath: string;
  /** Helper to build URLs from this base */
  buildUrl: (path: string) => string;
};

/**
 * Hook to get the image proxy URL information from Konflux public info.
 * Returns structured URL components and a helper to build URLs.
 *
 *
 * @returns [urlInfo: ImageProxyUrlInfo | null, loaded: boolean, error: unknown]
 * - urlInfo: URL information object with parsed components and buildUrl helper, or null if not available
 * - loaded: Whether the data has finished loading
 * - error: Any error that occurred while fetching the data
 */
export const useImageProxy = (): [ImageProxyUrlInfo | null, boolean, unknown] => {
  const [publicInfo, loaded, error] = useKonfluxPublicInfo();

  const imageProxyUrl = publicInfo?.imageProxy?.url;
  const oauthPath = publicInfo?.imageProxy?.oauthPath ?? '/oauth';

  if (!imageProxyUrl) {
    return [null, loaded, error];
  }

  const url = new URL(imageProxyUrl);
  const urlInfo = {
    fullUrl: url.href,
    hostname: url.hostname,
    oauthPath,
    buildUrl: (path: string) => {
      // Create a copy to avoid mutating the shared URL object
      const urlCopy = new URL(url);
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      urlCopy.pathname = normalizedPath;
      return urlCopy.href;
    },
  };

  return [urlInfo, loaded, error];
};
