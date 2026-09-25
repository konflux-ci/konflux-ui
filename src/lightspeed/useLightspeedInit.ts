import * as React from 'react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { AIStateContext, useIsInitializing } from '@redhat-cloud-services/ai-react-state';
import { getUserFacingErrorMessage } from '~/lightspeed/utils';
import { logger } from '~/monitoring/logger';

type UseLightspeedInitResult = {
  initError?: string;
  isInitializing: boolean;
  retryInit: () => void;
};

/**
 * Initializes AI client state once under `AIStateProvider` and exposes init errors for retry.
 */
export const useLightspeedInit = (): UseLightspeedInitResult => {
  const { getState } = React.useContext(AIStateContext);
  const isInitializing = useIsInitializing();
  const [initError, setInitError] = React.useState<string>();

  const retryInit = React.useCallback(() => {
    setInitError(undefined);
    void getState()
      .init()
      .catch((error: unknown) => {
        logger.error(
          'Failed to initialize Lightspeed client state',
          error instanceof Error ? error : new Error(String(error)),
        );
        const status = error instanceof AIClientError ? error.status : 0;
        setInitError(getUserFacingErrorMessage(status));
      });
  }, [getState]);

  React.useEffect(() => {
    retryInit();
  }, [retryInit]);

  return { initError, isInitializing, retryInit };
};
