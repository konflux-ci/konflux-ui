import * as React from 'react';
import { AIStateContext, AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';
import { getUserFacingErrorMessage } from '~/lightspeed/utils';
import { logger } from '~/monitoring/logger';

type LightspeedInitContextValue = {
  initError?: string;
  clearInitError: () => void;
};

const LightspeedInitContext = React.createContext<LightspeedInitContextValue>({
  clearInitError: () => undefined,
});

export const useLightspeedInitError = (): string | undefined =>
  React.useContext(LightspeedInitContext).initError;

export const useClearLightspeedInitError = (): (() => void) =>
  React.useContext(LightspeedInitContext).clearInitError;

type InitializeLightspeedStateProps = {
  onInitError: (message: string) => void;
};

const InitializeLightspeedState: React.FC<InitializeLightspeedStateProps> = ({ onInitError }) => {
  const { getState } = React.useContext(AIStateContext);

  React.useEffect(() => {
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

  return null;
};

export const LightspeedStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [initError, setInitError] = React.useState<string>();

  const clearInitError = React.useCallback(() => {
    setInitError(undefined);
  }, []);

  const onInitError = React.useCallback((message: string) => {
    setInitError(message);
  }, []);

  return (
    <LightspeedInitContext.Provider value={{ initError, clearInitError }}>
      <AIStateProvider client={getLightspeedClient()}>
        <InitializeLightspeedState onInitError={onInitError} />
        {children}
      </AIStateProvider>
    </LightspeedInitContext.Provider>
  );
};
