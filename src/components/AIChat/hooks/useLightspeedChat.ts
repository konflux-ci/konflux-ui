import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { logger } from '~/monitoring/logger';
import { KONFLUX_ASSISTANT_NAME } from '../consts';
import { getConversation, listConversations, query } from '../lightspeed-api';
import {
  buildQueryRequest,
  chatHistoryToMessages,
  filterGroupedConversations,
  generateMessageId,
  groupConversations,
} from '../utils';

type SendMessageErrorParams = {
  botMessageId: string;
  conversationId: string | null;
  error: unknown;
  setAnnouncement: React.Dispatch<React.SetStateAction<string | undefined>>;
  setBackendError: React.Dispatch<React.SetStateAction<string | undefined>>;
  setMessages: React.Dispatch<React.SetStateAction<MessageProps[]>>;
};

const handleSendMessageError = ({
  botMessageId,
  conversationId,
  error,
  setAnnouncement,
  setBackendError,
  setMessages,
}: SendMessageErrorParams): void => {
  const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
  setBackendError(errorMessage);
  setMessages((currentMessages) =>
    currentMessages.map((item) =>
      item.id === botMessageId
        ? {
            ...item,
            content: errorMessage,
            isLoading: false,
          }
        : item,
    ),
  );
  setAnnouncement(`Message from ${KONFLUX_ASSISTANT_NAME}: ${errorMessage}`);
  logger.error(
    'Lightspeed query failed',
    error instanceof Error ? error : new Error(errorMessage),
    { conversationId },
  );
};

type UseLightspeedChatResult = {
  activeConversationId: string | null;
  messages: MessageProps[];
  conversations: Record<string, Conversation[]> | Conversation[];
  announcement?: string;
  isSendButtonDisabled: boolean;
  isDrawerOpen: boolean;
  isLoadingConversation: boolean;
  backendError?: string;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refreshConversations: () => Promise<void>;
  startNewChat: () => void;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
  sendMessage: (message: string | number) => Promise<void>;
};

export const useLightspeedChat = (): UseLightspeedChatResult => {
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<MessageProps[]>([]);
  const [allConversations, setAllConversations] = React.useState<Record<string, Conversation[]>>(
    {},
  );
  const [conversations, setConversations] = React.useState<
    Record<string, Conversation[]> | Conversation[]
  >({});
  const [announcement, setAnnouncement] = React.useState<string>();
  const [isSendButtonDisabled, setIsSendButtonDisabled] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string>();
  const queryAbortRef = React.useRef<AbortController | null>(null);
  const isQueryInFlightRef = React.useRef(false);
  const activeConversationIdRef = React.useRef(activeConversationId);
  activeConversationIdRef.current = activeConversationId;

  const refreshConversations = React.useCallback(async () => {
    try {
      const response = await listConversations();
      const grouped = groupConversations(response.conversations);
      setAllConversations(grouped);
      setConversations(grouped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load conversations';
      logger.warn('Failed to load Lightspeed conversations', { error: message });
    }
  }, []);

  React.useEffect(
    () => () => {
      queryAbortRef.current?.abort();
    },
    [],
  );

  const startNewChat = React.useCallback(() => {
    queryAbortRef.current?.abort();
    setActiveConversationId(null);
    setMessages([]);
    setBackendError(undefined);
  }, []);

  const selectConversation = React.useCallback(async (conversationId: string) => {
    if (conversationId === 'no-results') {
      return;
    }

    setIsLoadingConversation(true);
    setBackendError(undefined);
    queryAbortRef.current?.abort();

    try {
      const response = await getConversation(conversationId);
      setActiveConversationId(response.conversation_id);
      setMessages(chatHistoryToMessages(response.chat_history));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load conversation';
      setBackendError(message);
      logger.warn('Failed to load Lightspeed conversation', { conversationId, error: message });
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  const filterConversations = React.useCallback(
    (searchValue: string) => {
      setConversations(filterGroupedConversations(allConversations, searchValue));
    },
    [allConversations],
  );

  const sendMessage = React.useCallback(
    async (message: string | number) => {
      const trimmedMessage = String(message).trim();
      if (!trimmedMessage || isQueryInFlightRef.current) {
        return;
      }

      queryAbortRef.current?.abort();
      const abortController = new AbortController();
      queryAbortRef.current = abortController;

      isQueryInFlightRef.current = true;
      setIsSendButtonDisabled(true);
      setBackendError(undefined);

      const conversationId = activeConversationIdRef.current;
      const timestamp = new Date().toLocaleString();
      const userMessage: MessageProps = {
        id: generateMessageId(),
        role: 'user',
        content: trimmedMessage,
        name: 'You',
        timestamp,
      };
      const botMessageId = generateMessageId();
      const loadingBotMessage: MessageProps = {
        id: botMessageId,
        role: 'bot',
        content: '',
        name: KONFLUX_ASSISTANT_NAME,
        isLoading: true,
        timestamp,
      };

      setMessages((currentMessages) => [...currentMessages, userMessage, loadingBotMessage]);
      setAnnouncement(`Message from you: ${trimmedMessage}. ${KONFLUX_ASSISTANT_NAME} is responding.`);

      try {
        const response = await query(
          buildQueryRequest(trimmedMessage, conversationId),
          abortController.signal,
        );

        setActiveConversationId(response.conversation_id);
        setMessages((currentMessages) =>
          currentMessages.map((item) =>
            item.id === botMessageId
              ? { ...item, content: response.response, isLoading: false }
              : item,
          ),
        );
        setAnnouncement(`Message from ${KONFLUX_ASSISTANT_NAME}: ${response.response}`);
        await refreshConversations();
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        handleSendMessageError({
          botMessageId,
          conversationId,
          error,
          setAnnouncement,
          setBackendError,
          setMessages,
        });
      } finally {
        isQueryInFlightRef.current = false;
        setIsSendButtonDisabled(false);
      }
    },
    [refreshConversations],
  );

  return {
    activeConversationId,
    messages,
    conversations,
    announcement,
    isSendButtonDisabled,
    isDrawerOpen,
    isLoadingConversation,
    backendError,
    setIsDrawerOpen,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
    sendMessage,
  };
};
