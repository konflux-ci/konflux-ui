import { matchPath, useLocation } from 'react-router-dom';

export function useActiveRouteChecker() {
  const location = useLocation();

  /**
   * Checks if the given route pattern matches the current location.
   * @param pattern The route pattern to test, e.g. '/workspaces' or '/workspaces/:namespace/applications/*'
   * @param options Options for matching. If exact is true, only an exact match is considered active.
   * @returns True if the pattern is active, false otherwise.
   */
  return (pattern, options?: { exact?: boolean }): boolean => {
    // Using React Router's matchPath to test the pattern against the current pathname.
    const match = matchPath({ path: pattern, end: options?.exact ?? false }, location.pathname);
    return Boolean(match);
  };
}
