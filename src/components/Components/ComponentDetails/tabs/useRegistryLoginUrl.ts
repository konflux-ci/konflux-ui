import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';

/**
 * Hook to get the registry login URL from Konflux public info.
 * Returns the OAuth token request URL or null if domain is not configured.
 *
 * @returns [url: string | null, loaded: boolean, error: unknown]
 * - url: The registry login URL or null if domain is not available
 * - loaded: Whether the data has finished loading
 * - error: Any error that occurred while fetching the data
 */
export const useRegistryLoginUrl = (): [string | null, boolean, unknown] => {
  const [publicInfo, loaded, error] = useKonfluxPublicInfo();

  // If there's an error, return null URL but pass the error through
  if (error) {
    return [null, loaded, error];
  }

  if (!loaded) {
    return [null, false, null];
  }

  // If domain is not configured, return null
  if (!publicInfo?.domain) {
    return [null, true, null];
  }

  // Construct and return the registry login URL
  const url = `https://oauth-openshift.${publicInfo.domain}/oauth/token/request`;
  return [url, true, null];
};
