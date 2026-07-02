import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { KONFLUX_ASSISTANT_NAME, NO_RESULTS_CONVERSATION_ID } from '~/components/AIChat/consts';
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

const DEFAULT_LIGHTSPEED_USER_ERROR_MESSAGE =
  'Konflux AI is temporarily unavailable. Please try again later.';

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
      return DEFAULT_LIGHTSPEED_USER_ERROR_MESSAGE;
    default:
      return DEFAULT_LIGHTSPEED_USER_ERROR_MESSAGE;
  }
};

const extractLightspeedErrorDetail = (
  errorBody: LightspeedErrorResponse & {
    detail?: string | LightspeedErrorResponse['detail'];
  },
  response: Response,
): string | undefined => {
  if (typeof errorBody.detail === 'string') {
    return errorBody.detail;
  }

  return (
    errorBody.detail?.response ??
    errorBody.detail?.cause ??
    response.statusText ??
    undefined
  );
};

export const parseLightspeedError = async (response: Response): Promise<string> => {
  let errorBody: unknown;
  let backendDetail: string | undefined;

  try {
    errorBody = await response.json();
    backendDetail = extractLightspeedErrorDetail(
      errorBody as LightspeedErrorResponse & {
        detail?: string | LightspeedErrorResponse['detail'];
      },
      response,
    );
  } catch {
    errorBody = undefined;
    backendDetail = response.statusText || undefined;
  }

  logger.warn('Lightspeed API request failed', {
    status: response.status,
    statusText: response.statusText,
    errorBody,
    detail: backendDetail,
  });

  return getUserFacingLightspeedErrorMessage(response.status);
};

const formatTurnTimestamp = (turn: LightspeedConversationTurn): string | undefined => {
  const timestamp = turn.completedAt ?? turn.startedAt;
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
