import * as React from 'react';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { KONFLUX_ASSISTANT_NAME } from '~/components/AIChat/consts';
import { logger } from '~/monitoring/logger';

type SendMessageErrorParams = {
  botMessageId: string;
  conversationId: string | null;
  error: unknown;
  setAnnouncement: React.Dispatch<React.SetStateAction<string | undefined>>;
  setMessages: React.Dispatch<React.SetStateAction<MessageProps[]>>;
};

export const handleSendMessageError = ({
  botMessageId,
  conversationId,
  error,
  setAnnouncement,
  setMessages,
}: SendMessageErrorParams): void => {
  const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
  setMessages((currentMessages) =>
    currentMessages.map((item) =>
      item.id === botMessageId
        ? {
            ...item,
            content: errorMessage,
            isLoading: false,
          }
        : item,
    ),
  );
  setAnnouncement(`Message from ${KONFLUX_ASSISTANT_NAME}: ${errorMessage}`);
  logger.error(
    'Lightspeed query failed',
    error instanceof Error ? error : new Error(errorMessage),
    { conversationId },
  );
};
