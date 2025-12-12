import { useKonfluxPublicInfo } from './useKonfluxPublicInfo';

/**
 * Hook to get the image proxy host from Konflux public info.
 * Extracts the hostname from the imageProxyUrl (e.g., "https://image-proxy.example.com" -> "image-proxy.example.com")
 *
 * @returns [host: string | null, loaded: boolean, error: unknown]
 * - host: The image proxy hostname or null if imageProxyUrl is not available
 * - loaded: Whether the data has finished loading
 * - error: Any error that occurred while fetching the data
 */
export const useImageProxyHost = (): [string | null, boolean, unknown] => {
  const [publicInfo, loaded, error] = useKonfluxPublicInfo();

  // Remove http:// or https:// prefix if present
  const host = publicInfo?.imageProxyUrl?.replace(/^https?:\/\//, '') ?? null;

  return [host, loaded, error];
};
