import React from 'react';

/**
 * Same as `useResizeObserver`, but observes via `useLayoutEffect` instead of
 * `useEffect`. Use this when the callback evaluates DOM dimensions (e.g.
 * `getBoundingClientRect`) that must be up to date before the browser paints,
 * avoiding a visible flicker/flash of incorrect layout.
 */
export const useLayoutResizeObserver = (
  callback: ResizeObserverCallback,
  targetElement: HTMLElement | null,
  observerOptions?: ResizeObserverOptions,
): void => {
  React.useLayoutEffect(() => {
    const observer = new ResizeObserver(callback);
    observer.observe(targetElement ?? document.body, observerOptions);
    return () => {
      observer.disconnect();
    };
  }, [callback, observerOptions, targetElement]);
};
