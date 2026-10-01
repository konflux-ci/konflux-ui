import * as React from 'react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { useSendStreamMessage } from '@redhat-cloud-services/ai-react-state';
import { LIGHTSPEED_ASSISTANT_NAME } from '~/lightspeed/const';
import { getUserFacingErrorMessage } from '~/lightspeed/utils';
import { logger } from '~/monitoring/logger';

type UseLightspeedSendResult = {
  announcement?: string;
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
 * Sends chat messages via Lightspeed SSE and tracks send errors / a11y announcements.
 */
export const useLightspeedSend = (isInProgress: boolean): UseLightspeedSendResult => {
  const [sendError, setSendError] = React.useState<string>();
  const [announcement, setAnnouncement] = React.useState<string>();
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
      setAnnouncement(
        `Message from you: ${trimmedMessage}. ${LIGHTSPEED_ASSISTANT_NAME} is responding.`,
      );

      try {
        const response = await sendStreamMessage(trimmedMessage);
        if (response?.answer) {
          setAnnouncement(`Message from ${LIGHTSPEED_ASSISTANT_NAME}: ${response.answer}`);
        }
      } catch (error) {
        logger.error(
          'Konflux AI streaming query failed',
          error instanceof Error ? error : new Error(String(error)),
        );

        const messageText = getErrorMessage(error);
        setSendError(messageText);
        setAnnouncement(`Message from ${LIGHTSPEED_ASSISTANT_NAME}: ${messageText}`);
      } finally {
        isSendingRef.current = false;
      }
    },
    [isInProgress, sendStreamMessage],
  );

  return { announcement, sendError, clearSendError, sendMessage };
};
