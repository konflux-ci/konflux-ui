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

/** Combines the Red Hat AI state hooks needed by the chat dock. */
export const useLightspeedChat = (): UseLightspeedChatResult => {
  const { initError, isInitializing, retryInit } = useLightspeedInit();
  const { messages, isInProgress } = useLightspeedMessages();
  const { sendError, clearSendError, sendMessage } = useLightspeedSend(isInProgress);

  const clearChatError = React.useCallback(() => {
    clearSendError();
    if (initError) {
      retryInit();
    }
  }, [clearSendError, initError, retryInit]);

  const announcement = React.useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return undefined;
    }
    if (lastMessage.isLoading) {
      return `${lastMessage.name} is responding.`;
    }
    return `Message from ${lastMessage.name}: ${lastMessage.content}`;
  }, [messages]);

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
