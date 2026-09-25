import * as React from 'react';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { useLightspeedInit } from '~/lightspeed/useLightspeedInit';
import { useLightspeedMessages } from '~/lightspeed/useLightspeedMessages';
import { useLightspeedSend } from '~/lightspeed/useLightspeedSend';

type UseLightspeedChatResult = {
  messages: MessageProps[];
  announcement?: string;
  isInProgress: boolean;
  isInitializing: boolean;
  chatError?: string;
  clearChatError: () => void;
  sendMessage: (message: string) => Promise<void>;
};

/**
 * Thin facade over Lightspeed init, messages, and send hooks.
 */
export const useLightspeedChat = (): UseLightspeedChatResult => {
  const { initError, isInitializing, retryInit } = useLightspeedInit();
  const { messages, isInProgress } = useLightspeedMessages();
  const { announcement, sendError, clearSendError, sendMessage } = useLightspeedSend(isInProgress);

  const clearChatError = React.useCallback(() => {
    clearSendError();
    retryInit();
  }, [clearSendError, retryInit]);

  return {
    messages,
    announcement,
    isInProgress,
    isInitializing: !initError && isInitializing,
    chatError: sendError ?? initError,
    clearChatError,
    sendMessage,
  };
};
