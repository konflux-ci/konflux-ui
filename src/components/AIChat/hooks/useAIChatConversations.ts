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
import type { ConversationDetails, LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { withConversationMenuActions } from '~/components/AIChat/conversationActions';
import { getUserFacingErrorMessage, toHistoryConversations } from '~/components/AIChat/message-utils';
import { updateListedConversationTopicSummary } from '~/lightspeed/lightspeedClient';
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
export type RenameConversationTarget = {
  conversationId: string;
  currentName: string;
};

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
  deleteConversationTarget: RenameConversationTarget | null;
  hasNoSearchResults: boolean;
  isDeletingConversation: boolean;
  isLoadingConversations: boolean;
  isRenamingConversation: boolean;
  renameConversationTarget: RenameConversationTarget | null;
  refreshConversations: () => Promise<void>;
  startNewChat: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
  clearConversationError: () => void;
  closeDeleteConversation: () => void;
  closeRenameConversation: () => void;
  confirmDeleteConversation: () => Promise<void>;
  confirmRenameConversation: (newName: string) => Promise<void>;
};

/**
 * Conversation list, search, selection, rename, and delete for the history drawer.
 */
export const useAIChatConversations = (): UseAIChatConversationsResult => {
  const [allConversations, setAllConversations] = React.useState<Conversation[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [conversationSearch, setConversationSearch] = React.useState('');
  const [conversationError, setConversationError] = React.useState<string>();
  const [isDeletingConversation, setIsDeletingConversation] = React.useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false);
  const [isRenamingConversation, setIsRenamingConversation] = React.useState(false);
  const [deleteConversationTarget, setDeleteConversationTarget] =
    React.useState<RenameConversationTarget | null>(null);
  const [renameConversationTarget, setRenameConversationTarget] =
    React.useState<RenameConversationTarget | null>(null);
  const conversationSearchRef = React.useRef(conversationSearch);
  conversationSearchRef.current = conversationSearch;

  const client = useClient<LightspeedClient>();
  const activeConversation = useActiveConversation();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();

  const activeConversationId = isTemporaryConversationId(activeConversation?.id)
    ? null
    : (activeConversation?.id ?? null);

  const clearConversationError = React.useCallback(() => {
    setConversationError(undefined);
  }, []);

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

  const deleteConversationById = React.useCallback(
    async (conversationId: string) => {
      try {
        setConversationError(undefined);
        await client.deleteConversation(conversationId);

        if (activeConversationId === conversationId) {
          await startNewChat();
        }

        await refreshConversations();
        setDeleteConversationTarget((current) =>
          current?.conversationId === conversationId ? null : current,
        );
      } catch (error) {
        const message = getErrorMessage(error);
        setConversationError(message);
        logger.warn('Failed to delete Lightspeed conversation', { conversationId, error: message });
      }
    },
    [activeConversationId, client, refreshConversations, startNewChat],
  );

  const requestDeleteConversation = React.useCallback(
    (conversationId: string, currentName: string) => {
      setRenameConversationTarget(null);
      setDeleteConversationTarget({ conversationId, currentName });
    },
    [],
  );

  const closeDeleteConversation = React.useCallback(() => {
    setDeleteConversationTarget(null);
  }, []);

  const confirmDeleteConversation = React.useCallback(async () => {
    if (!deleteConversationTarget || isDeletingConversation) {
      return;
    }

    const { conversationId } = deleteConversationTarget;
    setIsDeletingConversation(true);

    try {
      await deleteConversationById(conversationId);
    } finally {
      setIsDeletingConversation(false);
    }
  }, [deleteConversationById, deleteConversationTarget, isDeletingConversation]);

  const renameConversationById = React.useCallback((conversationId: string, currentName: string) => {
    setDeleteConversationTarget(null);
    setRenameConversationTarget({ conversationId, currentName });
  }, []);

  const closeRenameConversation = React.useCallback(() => {
    setRenameConversationTarget(null);
  }, []);

  const confirmRenameConversation = React.useCallback(
    async (newName: string) => {
      if (!renameConversationTarget) {
        return;
      }

      const { conversationId } = renameConversationTarget;
      setIsRenamingConversation(true);
      setConversationError(undefined);

      try {
        await client.updateConversation(conversationId, newName);
        await updateListedConversationTopicSummary(conversationId, newName);
        await refreshConversations();
        setRenameConversationTarget((current) =>
          current?.conversationId === conversationId ? null : current,
        );
      } catch (error) {
        const message = getErrorMessage(error);
        setConversationError(message);
        logger.warn('Failed to rename Lightspeed conversation', { conversationId, error: message });
      } finally {
        setIsRenamingConversation(false);
      }
    },
    [client, refreshConversations, renameConversationTarget],
  );

  const conversationsWithMenuActions = React.useMemo(
    () =>
      withConversationMenuActions(conversations, {
        onDeleteConversation: requestDeleteConversation,
        onRenameConversation: renameConversationById,
      }),
    [conversations, renameConversationById, requestDeleteConversation],
  );

  return {
    activeConversationId,
    conversations: conversationsWithMenuActions,
    conversationError,
    deleteConversationTarget,
    hasNoSearchResults: Boolean(conversationSearch.trim()) && conversations.length === 0,
    isDeletingConversation,
    isLoadingConversations,
    isRenamingConversation,
    renameConversationTarget,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
    clearConversationError,
    closeDeleteConversation,
    closeRenameConversation,
    confirmDeleteConversation,
    confirmRenameConversation,
  };
};
