import * as React from 'react';
import debounce from 'lodash/debounce';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';

interface Cancelable {
  cancel(): void;
  flush(): void;
}

export const useDebounceCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  timeout: number = 500,
  debounceParams: { leading?: boolean; trailing?: boolean; maxWait?: number } = {
    leading: false,
    trailing: true,
  },
) => {
  const memDebounceParams = useDeepCompareMemoize(debounceParams);
  const callbackRef = React.useRef<T>();
  callbackRef.current = callback;

  return React.useMemo(() => {
    return debounce(
      (...args) => callbackRef.current(...(args as unknown[])),
      timeout,
      memDebounceParams,
    ) as T & Cancelable;
  }, [memDebounceParams, timeout]);
};
