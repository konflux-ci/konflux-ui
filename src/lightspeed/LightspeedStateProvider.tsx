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

type InitializeLightspeedStateProps = {
  onInitError: (message: string) => void;
  retryInitRef: React.MutableRefObject<() => void>;
};

const InitializeLightspeedState: React.FC<InitializeLightspeedStateProps> = ({
  onInitError,
  retryInitRef,
}) => {
  const { getState } = React.useContext(AIStateContext);

  const runInit = React.useCallback(() => {
    void getState()
      .init()
      .catch((error: unknown) => {
        logger.error(
          'Failed to initialize Lightspeed client state',
          error instanceof Error ? error : new Error(String(error)),
        );
        onInitError(getUserFacingErrorMessage(0));
      });
  }, [getState, onInitError]);

  React.useEffect(() => {
    retryInitRef.current = runInit;
  }, [retryInitRef, runInit]);

  React.useEffect(() => {
    runInit();
  }, [runInit]);

  return null;
};

export const LightspeedStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [initError, setInitError] = React.useState<string>();
  const retryInitRef = React.useRef<() => void>(() => undefined);

  const onInitError = React.useCallback((message: string) => {
    setInitError(message);
  }, []);

  const retryInit = React.useCallback(() => {
    setInitError(undefined);
    retryInitRef.current();
  }, []);

  return (
    <LightspeedInitContext.Provider value={{ initError, retryInit }}>
      <AIStateProvider client={getLightspeedClient()}>
        <InitializeLightspeedState onInitError={onInitError} retryInitRef={retryInitRef} />
        {children}
      </AIStateProvider>
    </LightspeedInitContext.Provider>
  );
};
