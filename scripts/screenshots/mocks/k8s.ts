/**
 * Mock for useK8sWatchResource that reads return values from
 * window.__screenshotState.k8sResources, keyed by resource kind.
 *
 * Render files set the global before returning JSX:
 *   import { setScreenshotState } from '../types';
 *   setScreenshotState({
 *     k8sResources: {
 *       Application: { data: [...], isLoading: false },
 *       Component:   { data: [...], isLoading: false },
 *     },
 *   });
 */

import type { ScreenshotState } from '../types';

declare global {
  interface Window {
    __screenshotState?: ScreenshotState;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useK8sWatchResource = (resourceInit: any, _model?: any, _queryOptions?: any) => {
  const kind: string | undefined = resourceInit?.groupVersionKind?.kind;
  const entry = kind ? window.__screenshotState?.k8sResources?.[kind] : undefined;

  const data = entry?.data ?? (resourceInit?.isList ? [] : null);
  const isLoading = entry?.isLoading ?? false;
  const error = entry?.error ?? undefined;

  return {
    data,
    isLoading,
    error,
    isFetching: isLoading,
    isSuccess: !isLoading && !error,
    isError: !!error,
    status: isLoading ? ('pending' as const) : error ? ('error' as const) : ('success' as const),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    refetch: () => Promise.resolve({ data } as any),
  };
};
