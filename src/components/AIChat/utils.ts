import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { KONFLUX_ASSISTANT_NAME } from '~/components/AIChat/consts';
import type {
  LightspeedConversationDetails,
  LightspeedConversationTurn,
  LightspeedErrorResponse,
  LightspeedQueryRequest,
} from '~/components/AIChat/types';
import { logger } from '~/monitoring/logger';

export const generateMessageId = (): string => {
  const id = uuidv4();
  logger.debug('Generated AI chat message id', { id });
  return id;
};

export const buildQueryRequest = (
  trimmedMessage: string,
  conversationId: string | null,
): LightspeedQueryRequest =>
  conversationId
    ? {
        query: trimmedMessage,
        conversationId,
        generateTopicSummary: false,
      }
    : {
        query: trimmedMessage,
        generateTopicSummary: true,
      };

export const parseLightspeedError = async (response: Response): Promise<string> => {
  try {
    const errorBody = (await response.json()) as LightspeedErrorResponse & {
      detail?: string | LightspeedErrorResponse['detail'];
    };

    if (typeof errorBody.detail === 'string') {
      return errorBody.detail;
    }

    return (
      errorBody.detail?.response ??
      errorBody.detail?.cause ??
      response.statusText ??
      'Request failed'
    );
  } catch {
    return response.statusText || 'Request failed';
  }
};

const formatTurnTimestamp = (turn: LightspeedConversationTurn): string | undefined => {
  const timestamp = turn.completed_at ?? turn.started_at;
  return timestamp ? new Date(timestamp).toLocaleString() : undefined;
};

export const chatHistoryToMessages = (chatHistory: LightspeedConversationTurn[]): MessageProps[] => {
  const messages: MessageProps[] = [];

  chatHistory.forEach((turn) => {
    turn.messages.forEach((message) => {
      const isUser = message.type === 'user';
      const timestamp = formatTurnTimestamp(turn);
      messages.push({
        id: generateMessageId(),
        role: isUser ? 'user' : 'bot',
        content: message.content,
        name: isUser ? 'You' : KONFLUX_ASSISTANT_NAME,
        ...(timestamp ? { timestamp } : {}),
      });
    });
  });

  return messages;
};

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
    .sort((a, b) => dayjs(b.last_message_at).valueOf() - dayjs(a.last_message_at).valueOf())
    .forEach((conversation) => {
      const label = getConversationGroupLabel(conversation.last_message_at);
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push({
        id: conversation.conversation_id,
        text: conversation.topic_summary?.trim() || 'Untitled conversation',
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
    return [{ id: 'no-results', noIcon: true, text: 'No results found' }];
  }

  return filtered;
};
