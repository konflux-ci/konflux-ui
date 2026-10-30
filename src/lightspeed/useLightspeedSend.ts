import * as React from 'react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { useSendStreamMessage } from '@redhat-cloud-services/ai-react-state';
import { getUserFacingErrorMessage } from '~/components/AIChat/message-utils';
import { logger } from '~/monitoring/logger';

type UseLightspeedSendResult = {
  sendError?: string;
  clearSendError: () => void;
  sendMessage: (message: string) => Promise<void>;
};

const getErrorMessage = (error: unknown): string =>
  getUserFacingErrorMessage(error instanceof AIClientError ? error.status : 0);

/** Sends chat messages through the Red Hat AI state provider. */
export const useLightspeedSend = (isInProgress: boolean): UseLightspeedSendResult => {
  const [sendError, setSendError] = React.useState<string>();
  const sendStreamMessage = useSendStreamMessage();
  const isSendingRef = React.useRef(false);

  const clearSendError = React.useCallback(() => {
    setSendError(undefined);
  }, []);

  const sendMessage = React.useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isInProgress || isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;
      setSendError(undefined);

      try {
        await sendStreamMessage(trimmedMessage);
      } catch (error) {
        logger.error(
          'Konflux AI streaming query failed',
          error instanceof Error ? error : new Error(String(error)),
        );
        setSendError(getErrorMessage(error));
      } finally {
        isSendingRef.current = false;
      }
    },
    [isInProgress, sendStreamMessage],
  );

  return { sendError, clearSendError, sendMessage };
};
