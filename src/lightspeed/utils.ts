import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import type { Message } from '@redhat-cloud-services/ai-client-state';
import { LIGHTSPEED_ASSISTANT_NAME } from '~/lightspeed/const';

export const getUserFacingErrorMessage = (status: number): string => {
  switch (status) {
    case 401:
    case 403:
      return 'You do not have permission to use Konflux AI.';
    case 404:
      return 'The requested conversation was not found.';
    case 413:
      return 'Your message is too long. Please shorten it and try again.';
    case 429:
      return 'Konflux AI is temporarily unavailable due to quota limits. Please try again later.';
    case 503:
      return 'Konflux AI is temporarily unavailable. Please try again later.';
    default:
      return 'Konflux AI is temporarily unavailable. Please try again later.';
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
