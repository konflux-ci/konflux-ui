import * as React from 'react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { AIStateContext, useIsInitializing } from '@redhat-cloud-services/ai-react-state';
import { getUserFacingErrorMessage } from '~/components/AIChat/message-utils';
import { logger } from '~/monitoring/logger';

type AIChatInitContextValue = {
  initError?: string;
  isInitializing: boolean;
  retryInit: () => void;
};

const AIChatInitContext = React.createContext<AIChatInitContextValue | null>(null);

/**
 * Runs Lightspeed client `init()` once under `AIStateProvider` and shares init state
 * with chat components via context (avoids double-init and prop drilling).
 */
export const AIChatInitProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
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

  const value = React.useMemo(
    () => ({
      initError,
      isInitializing: !initError && isInitializing,
      retryInit,
    }),
    [initError, isInitializing, retryInit],
  );

  return <AIChatInitContext.Provider value={value}>{children}</AIChatInitContext.Provider>;
};

export const useAIChatInit = (): AIChatInitContextValue => {
  const value = React.useContext(AIChatInitContext);
  if (!value) {
    throw new Error('useAIChatInit must be used within AIChatInitProvider');
  }
  return value;
};
