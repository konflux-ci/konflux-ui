import * as React from 'react';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import {
  useInProgress,
  useIsInitializing,
  useMessages,
  useSendStreamMessage,
} from '@redhat-cloud-services/ai-react-state';
import { LIGHTSPEED_ASSISTANT_NAME } from '~/lightspeed/const';
import { useLightspeedInitError } from '~/lightspeed/LightspeedStateProvider';
import { getUserFacingErrorMessage, stateMessagesToMessageProps } from '~/lightspeed/utils';
import { logger } from '~/monitoring/logger';

type UseLightspeedChatResult = {
  messages: MessageProps[];
  announcement?: string;
  isSendButtonDisabled: boolean;
  isInitializing: boolean;
  backendError?: string;
  clearBackendError: () => void;
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
 * Send messages via Lightspeed SSE (`useSendStreamMessage` → `/v1/streaming_query`)
 * and map client-state messages into PatternFly Chatbot message props.
 */
export const useLightspeedChat = (): UseLightspeedChatResult => {
  const [backendError, setBackendError] = React.useState<string>();
  const [announcement, setAnnouncement] = React.useState<string>();

  const stateMessages = useMessages();
  const sendStreamMessage = useSendStreamMessage();
  const isInProgress = useInProgress();
  const isInitializing = useIsInitializing();
  const initError = useLightspeedInitError();
  const hasInitFailed = initError !== undefined;
  const isSendingRef = React.useRef(false);

  const messages = React.useMemo(
    () => stateMessagesToMessageProps(stateMessages, isInProgress),
    [isInProgress, stateMessages],
  );

  const clearBackendError = React.useCallback(() => {
    setBackendError(undefined);
  }, []);

  const sendMessage = React.useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isInProgress || isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;
      setBackendError(undefined);
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
        setBackendError(messageText);
        setAnnouncement(`Message from ${LIGHTSPEED_ASSISTANT_NAME}: ${messageText}`);
      } finally {
        isSendingRef.current = false;
      }
    },
    [isInProgress, sendStreamMessage],
  );

  return {
    messages,
    announcement,
    isSendButtonDisabled: isInProgress || (hasInitFailed ? true : isInitializing),
    isInitializing: hasInitFailed ? false : isInitializing,
    backendError: backendError ?? initError,
    clearBackendError,
    sendMessage,
  };
};
