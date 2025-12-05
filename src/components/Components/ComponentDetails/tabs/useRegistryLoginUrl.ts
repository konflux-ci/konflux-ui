import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';

/**
 * Hook to get the registry login URL from Konflux public info.
 * Returns the OAuth token request URL or null if imageProxyUrl is not configured.
 *
 * @returns [url: string | null, loaded: boolean, error: unknown]
 * - url: The registry login URL or null if imageProxyUrl is not available
 * - loaded: Whether the data has finished loading
 * - error: Any error that occurred while fetching the data
 */
export const useRegistryLoginUrl = (): [string | null, boolean, unknown] => {
  const [publicInfo, loaded, error] = useKonfluxPublicInfo();

  const url = publicInfo?.imageProxyUrl ? `${publicInfo.imageProxyUrl}/idp` : null;
  return [url, loaded, error];
};
