import * as React from 'react';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import {
  useInProgress,
  useIsInitializing,
  useMessages,
  useSendStreamMessage,
} from '@redhat-cloud-services/ai-react-state';
import { KONFLUX_ASSISTANT_NAME } from '~/components/AIChat/consts';
import {
  getUserFacingLightspeedErrorMessage,
  stateMessagesToMessageProps,
} from '~/components/AIChat/utils';
import { logger } from '~/monitoring/logger';

type UseLightspeedChatResult = {
  messages: MessageProps[];
  announcement?: string;
  isSendButtonDisabled: boolean;
  isInitializing: boolean;
  backendError?: string;
  sendMessage: (message: string | number) => Promise<void>;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AIClientError) {
    return getUserFacingLightspeedErrorMessage(error.status);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
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

  const messages = React.useMemo(
    () => stateMessagesToMessageProps(stateMessages, isInProgress),
    [isInProgress, stateMessages],
  );

  const sendMessage = React.useCallback(
    async (message: string | number) => {
      const trimmedMessage = String(message).trim();
      if (!trimmedMessage || isInProgress) {
        return;
      }

      setBackendError(undefined);
      setAnnouncement(
        `Message from you: ${trimmedMessage}. ${KONFLUX_ASSISTANT_NAME} is responding.`,
      );

      try {
        const response = await sendStreamMessage(trimmedMessage);
        if (response?.answer) {
          setAnnouncement(`Message from ${KONFLUX_ASSISTANT_NAME}: ${response.answer}`);
        }
      } catch (error) {
        const messageText = getErrorMessage(error, 'Failed to send message');
        setBackendError(messageText);
        setAnnouncement(`Message from ${KONFLUX_ASSISTANT_NAME}: ${messageText}`);
        logger.error(
          'Lightspeed streaming query failed',
          error instanceof Error ? error : new Error(messageText),
        );
      }
    },
    [isInProgress, sendStreamMessage],
  );

  return {
    messages,
    announcement,
    isSendButtonDisabled: isInProgress || isInitializing,
    isInitializing,
    backendError,
    sendMessage,
  };
};
