import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { useLightspeedChatSession } from '~/components/AIChat/hooks/useLightspeedChatSession';
import {
  type RenameConversationTarget,
  useLightspeedConversationHistory,
} from '~/components/AIChat/hooks/useLightspeedConversationHistory';

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

export const useLightspeedChat = (): UseLightspeedChatResult => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [backendError, setBackendError] = React.useState<string>();
  const activeConversationIdRef = React.useRef<string | null>(null);
  const onActiveConversationDeletedRef = React.useRef<() => void>(() => {});

  const conversationHistory = useLightspeedConversationHistory({
    activeConversationIdRef,
    onActiveConversationDeleted: () => onActiveConversationDeletedRef.current(),
    setBackendError,
  });

  const chatSession = useLightspeedChatSession({
    activeConversationIdRef,
    abortConversationList: conversationHistory.abortInFlightListRequest,
    refreshConversations: conversationHistory.refreshConversations,
    setBackendError,
  });

  onActiveConversationDeletedRef.current = chatSession.startNewChat;

  const abortChatSessionRef = React.useRef(chatSession.abortInFlightRequests);
  const abortConversationListRef = React.useRef(conversationHistory.abortInFlightListRequest);
  abortChatSessionRef.current = chatSession.abortInFlightRequests;
  abortConversationListRef.current = conversationHistory.abortInFlightListRequest;

  React.useEffect(
    () => () => {
      abortChatSessionRef.current();
      abortConversationListRef.current();
    },
    [],
  );

  return {
    activeConversationId: chatSession.activeConversationId,
    messages: chatSession.messages,
    conversations: conversationHistory.conversations,
    announcement: chatSession.announcement,
    isSendButtonDisabled: chatSession.isSendButtonDisabled,
    isDrawerOpen,
    isLoadingConversation: chatSession.isLoadingConversation,
    isRenamingConversation: conversationHistory.isRenamingConversation,
    backendError,
    renameConversationTarget: conversationHistory.renameConversationTarget,
    setIsDrawerOpen,
    refreshConversations: conversationHistory.refreshConversations,
    startNewChat: chatSession.startNewChat,
    selectConversation: chatSession.selectConversation,
    filterConversations: conversationHistory.filterConversations,
    sendMessage: chatSession.sendMessage,
    closeRenameConversation: conversationHistory.closeRenameConversation,
    confirmRenameConversation: conversationHistory.confirmRenameConversation,
  };
};
