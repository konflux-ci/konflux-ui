import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { orderBy } from 'lodash-es';
import type { IConversation } from '@redhat-cloud-services/ai-client-common';
import {
  useActiveConversation,
  useClient,
  useCreateNewConversation,
  useSetActiveConversation,
} from '@redhat-cloud-services/ai-react-state';
import { TEMP_CONVERSATION_ID as LIGHTSPEED_TEMP_CONVERSATION_ID } from '@redhat-cloud-services/lightspeed-client';
import type {
  ConversationDetails,
  LightspeedClient,
} from '@redhat-cloud-services/lightspeed-client';
import type { LightspeedConversationDetails } from '~/lightspeed/types';
import { logger } from '~/monitoring/logger';
import { filterByText } from '~/utils/text-filter-utils';

/** State-manager temp id (ai-client-state) — distinct from Lightspeed client temp id. */
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

const toHistoryConversations = (conversations: LightspeedConversationDetails[]): Conversation[] =>
  orderBy(conversations, ['lastMessageAt'], ['desc']).map((conversation) => ({
    id: conversation.conversationId,
    text: conversation.topicSummary?.trim() || 'Untitled conversation',
  }));

type UseAIChatConversationsResult = {
  activeConversationId: string | null;
  conversations: Conversation[];
  hasNoSearchResults: boolean;
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

  const client = useClient<LightspeedClient>();
  const activeConversation = useActiveConversation();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();

  const activeConversationId = isTemporaryConversationId(activeConversation?.id)
    ? null
    : (activeConversation?.id ?? null);

  const refreshConversations = React.useCallback(async () => {
    try {
      const response = await client.getConversations();
      const historyConversations = toHistoryConversations(
        mapConversationDetails(response.conversations),
      );
      setAllConversations(historyConversations);
      setConversations(filterByText(historyConversations, conversationSearch, (item) => item.text));
    } catch (error) {
      logger.warn('Failed to load Lightspeed conversations', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [client, conversationSearch]);

  const filterConversations = React.useCallback(
    (searchValue: string) => {
      setConversationSearch(searchValue);
      setConversations(filterByText(allConversations, searchValue, (item) => item.text));
    },
    [allConversations],
  );

  const startNewChat = React.useCallback(async () => {
    try {
      const conversation: IConversation = await createNewConversation();
      await setActiveConversation(conversation.id);
    } catch (error) {
      logger.warn('Failed to start new Lightspeed chat', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [createNewConversation, setActiveConversation]);

  const selectConversation = React.useCallback(
    async (conversationId: string) => {
      try {
        await setActiveConversation(conversationId);
      } catch (error) {
        logger.warn('Failed to load Lightspeed conversation', {
          conversationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [setActiveConversation],
  );

  return {
    activeConversationId,
    conversations,
    hasNoSearchResults: Boolean(conversationSearch.trim()) && conversations.length === 0,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
  };
};
