import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import dayjs from 'dayjs';
import type { Message } from '@redhat-cloud-services/ai-client-state';
import { KONFLUX_ASSISTANT_NAME, NO_RESULTS_CONVERSATION_ID } from '~/components/AIChat/consts';
import type { LightspeedConversationDetails } from '~/components/AIChat/types';

export const getUserFacingLightspeedErrorMessage = (status: number): string => {
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
): MessageProps[] =>
  messages.map((message, index) => {
    const isUser = message.role === 'user';
    const isLastMessage = index === messages.length - 1;
    const isLoading =
      !isUser && isInProgress && isLastMessage && message.answer.trim().length === 0;

    return {
      id: message.id,
      role: isUser ? 'user' : 'bot',
      content: message.answer,
      name: isUser ? 'You' : KONFLUX_ASSISTANT_NAME,
      timestamp: message.date.toLocaleString(),
      ...(isLoading ? { isLoading: true } : {}),
    };
  });

const getConversationGroupLabel = (dateValue: string): string => {
  const date = dayjs(dateValue);
  const today = dayjs();

  if (date.isSame(today, 'day')) {
    return 'Today';
  }
  if (date.isSame(today.subtract(1, 'day'), 'day')) {
    return 'Yesterday';
  }
  if (date.isSame(today, 'month')) {
    return 'This month';
  }
  return date.format('MMMM YYYY');
};

export const groupConversations = (
  conversations: LightspeedConversationDetails[],
): Record<string, Conversation[]> => {
  const grouped: Record<string, Conversation[]> = {};

  [...conversations]
    .sort((a, b) => dayjs(b.lastMessageAt).valueOf() - dayjs(a.lastMessageAt).valueOf())
    .forEach((conversation) => {
      const label = getConversationGroupLabel(conversation.lastMessageAt);
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push({
        id: conversation.conversationId,
        text: conversation.topicSummary?.trim() || 'Untitled conversation',
      });
    });

  return grouped;
};

export const filterGroupedConversations = (
  conversations: Record<string, Conversation[]>,
  searchValue: string,
): Record<string, Conversation[]> | Conversation[] => {
  const normalizedSearch = searchValue.trim().toLowerCase();
  if (!normalizedSearch) {
    return conversations;
  }

  const filtered = Object.entries(conversations).reduce<Record<string, Conversation[]>>(
    (acc, [group, items]) => {
      const matchingItems = items.filter((item) =>
        item.text.toLowerCase().includes(normalizedSearch),
      );
      if (matchingItems.length > 0) {
        acc[group] = matchingItems;
      }
      return acc;
    },
    {},
  );

  if (Object.keys(filtered).length === 0) {
    return [{ id: NO_RESULTS_CONVERSATION_ID, noIcon: true, text: 'No results found' }];
  }

  return filtered;
};
