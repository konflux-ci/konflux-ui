import * as React from 'react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { AIStateContext, useIsInitializing } from '@redhat-cloud-services/ai-react-state';
import { getUserFacingErrorMessage } from '~/components/AIChat/message-utils';
import { logger } from '~/monitoring/logger';

type UseLightspeedInitResult = {
  initError?: string;
  isInitializing: boolean;
  retryInit: () => void;
};

/** Initializes the client state managed by the Red Hat AI state provider. */
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
