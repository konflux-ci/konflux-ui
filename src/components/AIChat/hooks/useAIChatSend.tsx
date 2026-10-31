import * as React from 'react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { useInProgress, useSendStreamMessage } from '@redhat-cloud-services/ai-react-state';
import { getUserFacingErrorMessage } from '~/components/AIChat/message-utils';
import { logger } from '~/monitoring/logger';

type UseAIChatSendResult = {
  sendError?: string;
  clearSendError: () => void;
  sendMessage: (message: string) => Promise<void>;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AIClientError) {
    return getUserFacingErrorMessage(error.status);
  }
  // Never expose raw Error.message — network/fetch details may include internal URLs.
  return getUserFacingErrorMessage(0);
};

/**
 * Sends streaming messages through the Red Hat AI state provider.
 */
export const useAIChatSend = (): UseAIChatSendResult => {
  const [sendError, setSendError] = React.useState<string>();
  const sendStreamMessage = useSendStreamMessage();
  const isInProgress = useInProgress();
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
