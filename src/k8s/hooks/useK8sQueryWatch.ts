import * as React from 'react';
import { useDeepCompareMemoize } from '../../shared';
import { K8sResourceBaseOptions } from '../k8s-fetch';
import { watchListResource, watchObjectResource } from '../watch-utils';
import { WebSocketOptions } from '../web-socket/types';

const WS = new Map();

const WEBSOCKET_RETRY_COUNT = 3;
const WEBSOCKET_RETRY_DELAY = 2000;

export const useK8sQueryWatch = (
  resourceInit: K8sResourceBaseOptions,
  isList: boolean,
  hashedKey: string,
  options?: Partial<WebSocketOptions & RequestInit & { wsPrefix?: string; pathPrefix?: string }>,
) => {
  const deepResourceInit = useDeepCompareMemoize(resourceInit);
  const deepOptions = useDeepCompareMemoize(options);
  const retryCountRef = React.useRef(0);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout>();
  const [wsError, setWsError] = React.useState<{ code: number; message: string } | null>(null);

  const startWatch = React.useCallback(() => {
    if (!deepResourceInit) return;

    if (WS.has(hashedKey)) {
      WS.get(hashedKey).destroy();
      WS.delete(hashedKey);
    }

    const websocket = isList
      ? watchListResource(deepResourceInit, deepOptions)
      : watchObjectResource(deepResourceInit, deepOptions);

    websocket.onClose((event) => {
      if (event.code === 1006) {
        // eslint-disable-next-line no-console
        console.warn(`WebSocket closed unexpectedly for ${hashedKey}. Attempting reconnect...`);

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        if (retryCountRef.current < WEBSOCKET_RETRY_COUNT) {
          retryTimeoutRef.current = setTimeout(
            () => {
              retryCountRef.current += 1;
              startWatch();
            },
            WEBSOCKET_RETRY_DELAY * Math.pow(2, retryCountRef.current),
          ); // Exponential backoff
        } else {
          // eslint-disable-next-line no-console
          console.error(
            `Failed to reconnect WebSocket for ${hashedKey} after ${WEBSOCKET_RETRY_COUNT} attempts`,
          );
          setWsError({
            code: event.code,
            message: 'WebSocket connection failed after multiple attempts',
          });
          retryCountRef.current = 0;
        }
      }
    });

    websocket.onError((error) => {
      // eslint-disable-next-line no-console
      console.error(`WebSocket error for ${hashedKey}:`, error);
      setWsError({
        code: (error as unknown as { code: number }).code || 0,
        message: (error as unknown as { message: string }).message || 'Unknown WebSocket error',
      });
    });

    WS.set(hashedKey, websocket);
  }, [deepResourceInit, deepOptions, hashedKey, isList]);

  React.useEffect(() => {
    startWatch();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (deepResourceInit && WS.has(hashedKey)) {
        WS.get(hashedKey).destroy();
        WS.delete(hashedKey);
      }
      retryCountRef.current = 0;
      setWsError(null);
    };
  }, [hashedKey, deepOptions, deepResourceInit, startWatch]);

  return wsError;
};
