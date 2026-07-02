import * as React from 'react';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { KONFLUX_ASSISTANT_NAME, NO_RESULTS_CONVERSATION_ID } from '~/components/AIChat/consts';
import { handleSendMessageError } from '~/components/AIChat/hooks/sendMessageError';
import { getConversation, query } from '~/components/AIChat/lightspeed-api';
import {
  buildQueryRequest,
  chatHistoryToMessages,
  generateMessageId,
} from '~/components/AIChat/utils';
import { logger } from '~/monitoring/logger';

type UseLightspeedChatSessionParams = {
  activeConversationIdRef: React.MutableRefObject<string | null>;
  abortConversationList: () => void;
  refreshConversations: () => Promise<void>;
  setBackendError: React.Dispatch<React.SetStateAction<string | undefined>>;
};

export type UseLightspeedChatSessionResult = {
  activeConversationId: string | null;
  messages: MessageProps[];
  announcement?: string;
  isSendButtonDisabled: boolean;
  isLoadingConversation: boolean;
  startNewChat: () => void;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (message: string | number) => Promise<void>;
  abortInFlightRequests: () => void;
};

export const useLightspeedChatSession = ({
  activeConversationIdRef,
  abortConversationList,
  refreshConversations,
  setBackendError,
}: UseLightspeedChatSessionParams): UseLightspeedChatSessionResult => {
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<MessageProps[]>([]);
  const [announcement, setAnnouncement] = React.useState<string>();
  const [isSendButtonDisabled, setIsSendButtonDisabled] = React.useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = React.useState(false);
  const queryAbortRef = React.useRef<AbortController | null>(null);
  const conversationLoadAbortRef = React.useRef<AbortController | null>(null);
  const isQueryInFlightRef = React.useRef(false);

  activeConversationIdRef.current = activeConversationId;

  const abortInFlightRequests = React.useCallback(() => {
    queryAbortRef.current?.abort();
    conversationLoadAbortRef.current?.abort();
  }, []);

  const startNewChat = React.useCallback(() => {
    abortInFlightRequests();
    abortConversationList();
    setActiveConversationId(null);
    setMessages([]);
    setBackendError(undefined);
  }, [abortConversationList, abortInFlightRequests, setBackendError]);

  const selectConversation = React.useCallback(
    async (conversationId: string) => {
      if (conversationId === NO_RESULTS_CONVERSATION_ID) {
        return;
      }

      conversationLoadAbortRef.current?.abort();
      const abortController = new AbortController();
      conversationLoadAbortRef.current = abortController;

      setIsLoadingConversation(true);
      setBackendError(undefined);
      queryAbortRef.current?.abort();

      try {
        const response = await getConversation(conversationId, abortController.signal);

        if (abortController.signal.aborted) {
          return;
        }

        setActiveConversationId(response.conversationId);
        setMessages(chatHistoryToMessages(response.chatHistory));
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load conversation';
        setBackendError(message);
        logger.warn('Failed to load Lightspeed conversation', { conversationId, error: message });
      } finally {
        if (
          !abortController.signal.aborted &&
          conversationLoadAbortRef.current === abortController
        ) {
          setIsLoadingConversation(false);
        }
      }
    },
    [setBackendError],
  );

  const sendMessage = React.useCallback(
    async (message: string | number) => {
      const trimmedMessage = String(message).trim();
      if (!trimmedMessage || isQueryInFlightRef.current) {
        return;
      }

      isQueryInFlightRef.current = true;
      setIsSendButtonDisabled(true);

      queryAbortRef.current?.abort();
      const abortController = new AbortController();
      queryAbortRef.current = abortController;

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

        setActiveConversationId(response.conversationId);
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
          setMessages,
        });
      } finally {
        if (queryAbortRef.current === abortController) {
          isQueryInFlightRef.current = false;
          setIsSendButtonDisabled(false);
        }
      }
    },
    [activeConversationIdRef, refreshConversations, setBackendError],
  );

  return {
    activeConversationId,
    messages,
    announcement,
    isSendButtonDisabled,
    isLoadingConversation,
    startNewChat,
    selectConversation,
    sendMessage,
    abortInFlightRequests,
  };
};
