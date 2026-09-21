import * as React from 'react';
import { AIStateContext, AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';
import { getUserFacingErrorMessage } from '~/lightspeed/utils';
import { logger } from '~/monitoring/logger';

type LightspeedInitContextValue = {
  initError?: string;
  retryInit: () => void;
};

const LightspeedInitContext = React.createContext<LightspeedInitContextValue>({
  retryInit: () => undefined,
});

export const useLightspeedInitError = (): string | undefined =>
  React.useContext(LightspeedInitContext).initError;

export const useRetryLightspeedInit = (): (() => void) =>
  React.useContext(LightspeedInitContext).retryInit;

const InitializeLightspeedState: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { getState } = React.useContext(AIStateContext);
  const [initError, setInitError] = React.useState<string>();

  const runInit = React.useCallback(() => {
    setInitError(undefined);
    void getState()
      .init()
      .catch((error: unknown) => {
        logger.error(
          'Failed to initialize Lightspeed client state',
          error instanceof Error ? error : new Error(String(error)),
        );
        setInitError(getUserFacingErrorMessage(0));
      });
  }, [getState]);

  React.useEffect(() => {
    runInit();
  }, [runInit]);

  return (
    <LightspeedInitContext.Provider value={{ initError, retryInit: runInit }}>
      {children}
    </LightspeedInitContext.Provider>
  );
};

export const LightspeedStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <AIStateProvider client={getLightspeedClient()}>
    <InitializeLightspeedState>{children}</InitializeLightspeedState>
  </AIStateProvider>
);
