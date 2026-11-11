import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { AIClientError, type IConversation } from '@redhat-cloud-services/ai-client-common';
import {
  useActiveConversation,
  useClient,
  useCreateNewConversation,
  useSetActiveConversation,
} from '@redhat-cloud-services/ai-react-state';
import {
  LightspeedClientError,
  TEMP_CONVERSATION_ID as LIGHTSPEED_TEMP_CONVERSATION_ID,
} from '@redhat-cloud-services/lightspeed-client';
import type {
  ConversationDetails,
  LightspeedClient,
} from '@redhat-cloud-services/lightspeed-client';
import { getUserFacingErrorMessage, toHistoryConversations } from '~/components/AIChat/message-utils';
import type { LightspeedConversationDetails } from '~/lightspeed/types';
import { logger } from '~/monitoring/logger';
import { filterByText } from '~/utils/text-filter-utils';

/**
 * Unexported `TEMP_CONVERSATION_ID` in
 * `@redhat-cloud-services/ai-client-state` `src/lib/state-manager.js`.
 * Distinct from Lightspeed's exported temp conversation id.
 */
const STATE_TEMP_CONVERSATION_ID = '__temp_conversation__';

const isTemporaryConversationId = (conversationId?: string): boolean =>
  !conversationId ||
  conversationId === STATE_TEMP_CONVERSATION_ID ||
  conversationId === LIGHTSPEED_TEMP_CONVERSATION_ID;

/**
 * List items are `ConversationDetails` from `@redhat-cloud-services/lightspeed-client`,
 * including `topic_summary` (https://github.com/RedHatInsights/ai-web-clients/pull/5).
 */
const hasHistoryTimestamp = (
  conversation: ConversationDetails,
): conversation is ConversationDetails & {
  conversation_id: string;
  last_message_at: string;
} => Boolean(conversation.conversation_id && conversation.last_message_at);

const mapConversationDetails = (
  conversations: ConversationDetails[],
): LightspeedConversationDetails[] =>
  conversations.filter(hasHistoryTimestamp).map(
      ({
        conversation_id: conversationId,
        created_at: createdAt,
        last_message_at: lastMessageAt,
        message_count: messageCount,
        last_used_model: lastUsedModel,
        last_used_provider: lastUsedProvider,
        topic_summary: topicSummary,
      }) => ({
        conversationId,
        createdAt: createdAt ?? lastMessageAt,
        lastMessageAt,
        messageCount: messageCount ?? 0,
        ...(lastUsedModel ? { lastUsedModel } : {}),
        ...(lastUsedProvider ? { lastUsedProvider } : {}),
        ...(topicSummary ? { topicSummary } : {}),
      }),
    );

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AIClientError || error instanceof LightspeedClientError) {
    return getUserFacingErrorMessage(error.status);
  }
  // Never expose raw Error.message — network details may include internal URLs.
  return getUserFacingErrorMessage(0);
};

const reportConversationError = (
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
) => {
  logger.error(message, error instanceof Error ? error : new Error(String(error)), context);
};

type UseAIChatConversationsResult = {
  activeConversationId: string | null;
  conversations: Conversation[];
  conversationError?: string;
  hasNoSearchResults: boolean;
  isLoadingConversations: boolean;
  refreshConversations: () => Promise<void>;
  startNewChat: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
};

/**
 * Conversation list, search, selection, and new-chat actions for the history drawer.
 */
export const useAIChatConversations = (): UseAIChatConversationsResult => {
  const [allConversations, setAllConversations] = React.useState<Conversation[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [conversationSearch, setConversationSearch] = React.useState('');
  const [conversationError, setConversationError] = React.useState<string>();
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false);
  const conversationSearchRef = React.useRef(conversationSearch);
  conversationSearchRef.current = conversationSearch;

  const client = useClient<LightspeedClient>();
  const activeConversation = useActiveConversation();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();

  const activeConversationId = isTemporaryConversationId(activeConversation?.id)
    ? null
    : (activeConversation?.id ?? null);

  const refreshConversations = React.useCallback(async () => {
    setIsLoadingConversations(true);
    setConversationError(undefined);

    try {
      const response = await client.getConversations();
      const historyConversations = toHistoryConversations(
        mapConversationDetails(response.conversations),
      );
      setAllConversations(historyConversations);
      setConversations(
        filterByText(historyConversations, conversationSearchRef.current, (item) => item.text),
      );
    } catch (error) {
      reportConversationError('Failed to load Lightspeed conversations', error);
      setConversationError(getErrorMessage(error));
    } finally {
      setIsLoadingConversations(false);
    }
  }, [client]);

  const filterConversations = React.useCallback(
    (searchValue: string) => {
      setConversationSearch(searchValue);
      setConversations(filterByText(allConversations, searchValue, (item) => item.text));
    },
    [allConversations],
  );

  const startNewChat = React.useCallback(async () => {
    setConversationError(undefined);

    try {
      const conversation: IConversation = await createNewConversation();
      await setActiveConversation(conversation.id);
    } catch (error) {
      reportConversationError('Failed to start new Lightspeed chat', error);
      setConversationError(getErrorMessage(error));
    }
  }, [createNewConversation, setActiveConversation]);

  const selectConversation = React.useCallback(
    async (conversationId: string) => {
      setConversationError(undefined);

      try {
        await setActiveConversation(conversationId);
      } catch (error) {
        reportConversationError('Failed to load Lightspeed conversation', error, {
          conversationId,
        });
        setConversationError(getErrorMessage(error));
      }
    },
    [setActiveConversation],
  );

  return {
    activeConversationId,
    conversations,
    conversationError,
    hasNoSearchResults: Boolean(conversationSearch.trim()) && conversations.length === 0,
    isLoadingConversations,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
  };
};
