import * as React from 'react';
import {
  AIStateContext,
  AIStateProvider,
} from '@redhat-cloud-services/ai-react-state';
import { getLightspeedClient } from '~/components/AIChat/lightspeedClient';
import { logger } from '~/monitoring/logger';

const InitializeLightspeedState: React.FC = () => {
  const { getState } = React.useContext(AIStateContext);

  React.useEffect(() => {
    void getState()
      .init()
      .catch((error: unknown) => {
        logger.warn('Failed to initialize Lightspeed client state', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
  }, [getState]);

  return null;
};

export const AIChatStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <AIStateProvider client={getLightspeedClient()}>
    <InitializeLightspeedState />
    {children}
  </AIStateProvider>
);
