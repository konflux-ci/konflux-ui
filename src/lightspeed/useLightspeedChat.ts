import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import type { IConversation } from '@redhat-cloud-services/ai-client-common';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import {
  useActiveConversation,
  useClient,
  useCreateNewConversation,
  useInProgress,
  useIsInitializing,
  useMessages,
  useSendStreamMessage,
  useSetActiveConversation,
} from '@redhat-cloud-services/ai-react-state';
import type { ConversationDetails } from '@redhat-cloud-services/lightspeed-client';
import {
  LightspeedClient,
  TEMP_CONVERSATION_ID as LIGHTSPEED_TEMP_CONVERSATION_ID,
} from '@redhat-cloud-services/lightspeed-client';
import { withConversationMenuActions } from '~/components/AIChat/conversationActions';
import { updateConversationTopicSummary } from '~/components/AIChat/lightspeedConversationApi';
import { LIGHTSPEED_ASSISTANT_NAME } from '~/lightspeed/const';
import { useLightspeedInitError } from '~/lightspeed/LightspeedStateProvider';
import type { LightspeedConversationDetails } from '~/lightspeed/types';
import {
  getUserFacingErrorMessage,
  stateMessagesToMessageProps,
  toHistoryConversations,
} from '~/lightspeed/utils';
import { logger } from '~/monitoring/logger';
import { filterByText } from '~/utils/text-filter-utils';

/** State-manager temp id (ai-client-state) — distinct from Lightspeed client temp id. */
const STATE_TEMP_CONVERSATION_ID = '__temp_conversation__';

const isTemporaryConversationId = (conversationId?: string): boolean =>
  !conversationId ||
  conversationId === STATE_TEMP_CONVERSATION_ID ||
  conversationId === LIGHTSPEED_TEMP_CONVERSATION_ID;

export type RenameConversationTarget = {
  conversationId: string;
  currentName: string;
};

type UseLightspeedChatResult = {
  activeConversationId: string | null;
  messages: MessageProps[];
  conversations: Conversation[];
  announcement?: string;
  isSendButtonDisabled: boolean;
  isDrawerOpen: boolean;
  isLoadingConversation: boolean;
  isRenamingConversation: boolean;
  hasNoSearchResults: boolean;
  backendError?: string;
  renameConversationTarget: RenameConversationTarget | null;
  historyMenuKey: number;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refreshConversations: () => Promise<void>;
  startNewChat: () => void;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
  sendMessage: (message: string | number) => Promise<void>;
  closeRenameConversation: () => void;
  confirmRenameConversation: (newName: string) => Promise<void>;
};

type LightspeedConversationWire = ConversationDetails & {
  topic_summary?: string;
};

const mapConversationDetails = (
  conversations: ConversationDetails[],
): LightspeedConversationDetails[] =>
  (conversations as LightspeedConversationWire[])
    .filter((conversation) => Boolean(conversation.conversation_id && conversation.last_message_at))
    .map(
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
  if (error instanceof AIClientError) {
    return getUserFacingErrorMessage(error.status);
  }
  return getUserFacingErrorMessage(0);
};

/**
 * Lightspeed chat: streaming send/receive plus conversation history, delete, and rename.
 */
export const useLightspeedChat = (): UseLightspeedChatResult => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string>();
  const [announcement, setAnnouncement] = React.useState<string>();
  const [allConversations, setAllConversations] = React.useState<Conversation[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [conversationSearch, setConversationSearch] = React.useState('');
  const [isRenamingConversation, setIsRenamingConversation] = React.useState(false);
  const [renameConversationTarget, setRenameConversationTarget] =
    React.useState<RenameConversationTarget | null>(null);
  const [historyMenuKey, setHistoryMenuKey] = React.useState(0);

  const client = useClient<LightspeedClient>();
  const activeConversation = useActiveConversation();
  const stateMessages = useMessages();
  const sendStreamMessage = useSendStreamMessage();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();
  const isInProgress = useInProgress();
  const isInitializing = useIsInitializing();
  const initError = useLightspeedInitError();
  const hasInitFailed = initError !== undefined;
  const isSendingRef = React.useRef(false);

  const activeConversationId = isTemporaryConversationId(activeConversation?.id)
    ? null
    : (activeConversation?.id ?? null);

  const messages = React.useMemo(
    () => stateMessagesToMessageProps(stateMessages, isInProgress),
    [isInProgress, stateMessages],
  );

  const refreshConversations = React.useCallback(async () => {
    try {
      const response = await client.getConversations();
      const historyConversations = toHistoryConversations(
        mapConversationDetails(response.conversations),
      );
      setAllConversations(historyConversations);
      setConversationSearch('');
      setConversations(historyConversations);
    } catch (error) {
      logger.warn('Failed to load Lightspeed conversations', {
        error: getErrorMessage(error),
      });
    }
  }, [client]);

  const filterConversations = React.useCallback(
    (searchValue: string) => {
      setConversationSearch(searchValue);
      setConversations(filterByText(allConversations, searchValue, (item) => item.text));
    },
    [allConversations],
  );

  const startNewChat = React.useCallback(() => {
    void (async () => {
      try {
        const conversation: IConversation = await createNewConversation();
        await setActiveConversation(conversation.id);
        setBackendError(undefined);
      } catch (error) {
        const message = getErrorMessage(error);
        setBackendError(message);
        logger.warn('Failed to start new Lightspeed chat', { error: message });
      }
    })();
  }, [createNewConversation, setActiveConversation]);

  const selectConversation = React.useCallback(
    async (conversationId: string) => {
      setBackendError(undefined);

      try {
        await setActiveConversation(conversationId);
      } catch (error) {
        const message = getErrorMessage(error);
        setBackendError(message);
        logger.warn('Failed to load Lightspeed conversation', { conversationId, error: message });
      }
    },
    [setActiveConversation],
  );

  const sendMessage = React.useCallback(
    async (message: string | number) => {
      const trimmedMessage = String(message).trim();
      if (!trimmedMessage || isInProgress || isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;
      setBackendError(undefined);
      setAnnouncement(
        `Message from you: ${trimmedMessage}. ${LIGHTSPEED_ASSISTANT_NAME} is responding.`,
      );

      try {
        const response = await sendStreamMessage(trimmedMessage);
        if (response?.answer) {
          setAnnouncement(`Message from ${LIGHTSPEED_ASSISTANT_NAME}: ${response.answer}`);
        }
        await refreshConversations();
      } catch (error) {
        const messageText = getErrorMessage(error);
        setBackendError(messageText);
        setAnnouncement(`Message from ${LIGHTSPEED_ASSISTANT_NAME}: ${messageText}`);
        logger.error(
          'Konflux AI streaming query failed',
          error instanceof Error ? error : new Error(messageText),
          { conversationId: activeConversationId },
        );
      } finally {
        isSendingRef.current = false;
      }
    },
    [activeConversationId, isInProgress, refreshConversations, sendStreamMessage],
  );

  const deleteConversationById = React.useCallback(
    async (conversationId: string) => {
      try {
        await client.deleteConversation(conversationId);

        if (activeConversationId === conversationId) {
          startNewChat();
        }

        await refreshConversations();
      } catch (error) {
        const message = getErrorMessage(error);
        setBackendError(message);
        logger.warn('Failed to delete Lightspeed conversation', { conversationId, error: message });
      }
    },
    [activeConversationId, client, refreshConversations, startNewChat],
  );

  const renameConversationById = React.useCallback((conversationId: string, currentName: string) => {
    setHistoryMenuKey((key) => key + 1);
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
      setBackendError(undefined);

      try {
        await updateConversationTopicSummary(conversationId, { topicSummary: newName });
        await refreshConversations();
        setRenameConversationTarget(null);
      } catch (error) {
        const message = getErrorMessage(error);
        setBackendError(message);
        logger.warn('Failed to rename Lightspeed conversation', { conversationId, error: message });
      } finally {
        setIsRenamingConversation(false);
      }
    },
    [refreshConversations, renameConversationTarget],
  );

  const conversationsWithMenuActions = React.useMemo(
    () =>
      withConversationMenuActions(conversations, {
        onDeleteConversation: (conversationId) => {
          void deleteConversationById(conversationId);
        },
        onRenameConversation: renameConversationById,
      }),
    [conversations, deleteConversationById, renameConversationById],
  );

  return {
    activeConversationId,
    messages,
    conversations: conversationsWithMenuActions,
    announcement,
    isSendButtonDisabled: isInProgress || (hasInitFailed ? true : isInitializing),
    isDrawerOpen,
    isLoadingConversation: hasInitFailed ? false : isInitializing,
    isRenamingConversation,
    hasNoSearchResults: Boolean(conversationSearch.trim()) && conversations.length === 0,
    backendError: backendError ?? initError,
    renameConversationTarget,
    historyMenuKey,
    setIsDrawerOpen,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
    sendMessage,
    closeRenameConversation,
    confirmRenameConversation,
  };
};
