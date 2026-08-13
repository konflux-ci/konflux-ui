import React from 'react';

type ObservableElement = HTMLElement | null | undefined;

/**
 * Returns a stable reference to `elements` as long as its length and the
 * identity of each entry haven't changed. Callers commonly pass a fresh
 * array literal on every render (e.g. `[tableNode, scrollElement]`); without
 * this, `useLayoutEffect`'s dependency array would see a "new" array every
 * render and needlessly disconnect/reconnect the observer.
 */
const useStableElements = (elements: ObservableElement[]): ObservableElement[] => {
  const ref = React.useRef(elements);

  const changed =
    ref.current.length !== elements.length || ref.current.some((el, i) => el !== elements[i]);

  if (changed) {
    ref.current = elements;
  }

  return ref.current;
};

/**
 * Same as `useResizeObserver`, but observes via `useLayoutEffect` instead of
 * `useEffect`. Use this when the callback evaluates DOM dimensions (e.g.
 * `getBoundingClientRect`) that must be up to date before the browser paints,
 * avoiding a visible flicker/flash of incorrect layout.
 *
 * Accepts multiple elements so a single `ResizeObserver` instance can watch
 * all of them -- `null`/`undefined` entries (e.g. refs not yet mounted) are
 * skipped.
 *
 * `callback` also runs once synchronously right after the observer is set up
 * (with an empty entries array), so callers get an up-to-date value before
 * the first paint without depending on the browser's own initial
 * notification. Callbacks should therefore re-measure the DOM directly
 * (e.g. via `getBoundingClientRect`) rather than relying on `entries`.
 *
 * @example
 * ```tsx
 * useLayoutResizeObserver(recalculate, [tableNode, scrollElement]);
 * ```
 */
export const useLayoutResizeObserver = (
  callback: ResizeObserverCallback,
  elements: ObservableElement[],
  observerOptions?: ResizeObserverOptions,
): void => {
  const stableElements = useStableElements(elements);

  React.useLayoutEffect(() => {
    const observer = new ResizeObserver(callback);
    const targets = stableElements.filter((el): el is HTMLElement => Boolean(el));
    targets.forEach((el) => observer.observe(el, observerOptions));

    callback([], observer);

    return () => {
      observer.disconnect();
    };
  }, [callback, observerOptions, stableElements]);
};
