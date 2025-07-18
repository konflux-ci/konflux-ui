import * as React from 'react';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';

export interface UseMutationObserverOptions {
  childList?: boolean;
  subtree?: boolean;
  attributes?: boolean;
  attributeFilter?: string[];
  characterData?: boolean;
  attributeOldValue?: boolean;
  characterDataOldValue?: boolean;
}

export const useMutationObserver = (
  callback: MutationCallback,
  targetElement: HTMLElement | null,
  options: UseMutationObserverOptions = {
    childList: true,
    subtree: true,
    attributes: true,
  },
): void => {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  const memoizedOptions = useDeepCompareMemoize(options);

  React.useEffect(() => {
    if (!targetElement) {
      return;
    }

    const observer = new MutationObserver((mutations, observerInstance) => {
      callbackRef.current(mutations, observerInstance);
    });

    observer.observe(targetElement, memoizedOptions);

    return () => {
      observer.disconnect();
    };
  }, [targetElement, memoizedOptions]);
};
