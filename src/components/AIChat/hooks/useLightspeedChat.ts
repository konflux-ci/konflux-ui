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
import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import {
  KONFLUX_ASSISTANT_NAME,
  NO_RESULTS_CONVERSATION_ID,
} from '~/components/AIChat/consts';
import { withConversationMenuActions } from '~/components/AIChat/conversationActions';
import { updateConversationTopicSummary } from '~/components/AIChat/lightspeedConversationApi';
import type { LightspeedConversationDetails } from '~/components/AIChat/types';
import {
  filterGroupedConversations,
  getUserFacingLightspeedErrorMessage,
  groupConversations,
  stateMessagesToMessageProps,
} from '~/components/AIChat/utils';
import { logger } from '~/monitoring/logger';

const TEMP_CONVERSATION_ID = '__temp_conversation__';

export type RenameConversationTarget = {
  conversationId: string;
  currentName: string;
};

type UseLightspeedChatResult = {
  activeConversationId: string | null;
  messages: MessageProps[];
  conversations: Record<string, Conversation[]> | Conversation[];
  announcement?: string;
  isSendButtonDisabled: boolean;
  isDrawerOpen: boolean;
  isLoadingConversation: boolean;
  isRenamingConversation: boolean;
  backendError?: string;
  renameConversationTarget: RenameConversationTarget | null;
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

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AIClientError) {
    return getUserFacingLightspeedErrorMessage(error.status);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const useLightspeedChat = (): UseLightspeedChatResult => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string>();
  const [announcement, setAnnouncement] = React.useState<string>();
  const [allConversations, setAllConversations] = React.useState<Record<string, Conversation[]>>(
    {},
  );
  const [conversations, setConversations] = React.useState<
    Record<string, Conversation[]> | Conversation[]
  >({});
  const [isRenamingConversation, setIsRenamingConversation] = React.useState(false);
  const [renameConversationTarget, setRenameConversationTarget] =
    React.useState<RenameConversationTarget | null>(null);

  const client = useClient<LightspeedClient>();
  const activeConversation = useActiveConversation();
  const stateMessages = useMessages();
  const sendMessageToState = useSendStreamMessage();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();
  const isInProgress = useInProgress();
  const isInitializing = useIsInitializing();

  const activeConversationId =
    activeConversation?.id && activeConversation.id !== TEMP_CONVERSATION_ID
      ? activeConversation.id
      : null;

  const messages = React.useMemo(
    () => stateMessagesToMessageProps(stateMessages, isInProgress),
    [isInProgress, stateMessages],
  );

  const refreshConversations = React.useCallback(async () => {
    try {
      const response = await client.getConversations();
      const grouped = groupConversations(mapConversationDetails(response.conversations));
      setAllConversations(grouped);
      setConversations(grouped);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load conversations');
      logger.warn('Failed to load Lightspeed conversations', { error: message });
    }
  }, [client]);

  const filterConversations = React.useCallback(
    (searchValue: string) => {
      setConversations(filterGroupedConversations(allConversations, searchValue));
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
        const message = getErrorMessage(error, 'Failed to start a new chat');
        setBackendError(message);
        logger.warn('Failed to start new Lightspeed chat', { error: message });
      }
    })();
  }, [createNewConversation, setActiveConversation]);

  const selectConversation = React.useCallback(
    async (conversationId: string) => {
      if (conversationId === NO_RESULTS_CONVERSATION_ID) {
        return;
      }

      setBackendError(undefined);

      try {
        await setActiveConversation(conversationId);
      } catch (error) {
        const message = getErrorMessage(error, 'Failed to load conversation');
        setBackendError(message);
        logger.warn('Failed to load Lightspeed conversation', { conversationId, error: message });
      }
    },
    [setActiveConversation],
  );

  const sendMessage = React.useCallback(
    async (message: string | number) => {
      const trimmedMessage = String(message).trim();
      if (!trimmedMessage || isInProgress) {
        return;
      }

      setBackendError(undefined);
      setAnnouncement(
        `Message from you: ${trimmedMessage}. ${KONFLUX_ASSISTANT_NAME} is responding.`,
      );

      try {
        const response = await sendMessageToState(trimmedMessage);
        if (response?.answer) {
          setAnnouncement(`Message from ${KONFLUX_ASSISTANT_NAME}: ${response.answer}`);
        }
        await refreshConversations();
      } catch (error) {
        const messageText = getErrorMessage(error, 'Failed to send message');
        setBackendError(messageText);
        setAnnouncement(`Message from ${KONFLUX_ASSISTANT_NAME}: ${messageText}`);
        logger.error(
          'Lightspeed query failed',
          error instanceof Error ? error : new Error(messageText),
          { conversationId: activeConversationId },
        );
      }
    },
    [activeConversationId, isInProgress, refreshConversations, sendMessageToState],
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
        const message = getErrorMessage(error, 'Failed to delete conversation');
        setBackendError(message);
        logger.warn('Failed to delete Lightspeed conversation', { conversationId, error: message });
      }
    },
    [activeConversationId, client, refreshConversations, startNewChat],
  );

  const renameConversationById = React.useCallback((conversationId: string, currentName: string) => {
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
        const message = getErrorMessage(error, 'Failed to rename conversation');
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
    isSendButtonDisabled: isInProgress,
    isDrawerOpen,
    isLoadingConversation: isInitializing,
    isRenamingConversation,
    backendError,
    renameConversationTarget,
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
