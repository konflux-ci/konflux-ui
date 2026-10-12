import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import type { Message } from '@redhat-cloud-services/ai-client-state';
import {
  KONFLUX_AI_ERROR_MESSAGE_TOO_LONG,
  KONFLUX_AI_ERROR_NOT_FOUND,
  KONFLUX_AI_ERROR_PERMISSION,
  KONFLUX_AI_ERROR_QUOTA,
  KONFLUX_AI_ERROR_UNAVAILABLE,
} from '~/components/AIChat/const';
import { LIGHTSPEED_ASSISTANT_NAME } from '~/lightspeed/const';

export const getUserFacingErrorMessage = (status: number): string => {
  switch (status) {
    case 401:
    case 403:
      return KONFLUX_AI_ERROR_PERMISSION;
    case 404:
      return KONFLUX_AI_ERROR_NOT_FOUND;
    case 413:
      return KONFLUX_AI_ERROR_MESSAGE_TOO_LONG;
    case 429:
      return KONFLUX_AI_ERROR_QUOTA;
    case 503:
      return KONFLUX_AI_ERROR_UNAVAILABLE;
    default:
      return KONFLUX_AI_ERROR_UNAVAILABLE;
  }
};

export const stateMessagesToMessageProps = (
  messages: Message[],
  isInProgress: boolean,
  assistantName: string = LIGHTSPEED_ASSISTANT_NAME,
): MessageProps[] =>
  messages.map((message, index) => {
    const isUser = message.role === 'user';
    const isLastMessage = index === messages.length - 1;
    const isLoading =
      !isUser && isInProgress && isLastMessage && message.answer.trim().length === 0;

    return {
      id: message.id,
      role: isUser ? 'user' : 'bot',
      alignment: isUser ? 'end' : 'start',
      content: message.answer,
      name: isUser ? 'You' : assistantName,
      timestamp: message.date.toLocaleString(),
      ...(isLoading ? { isLoading: true } : {}),
    };
  });
