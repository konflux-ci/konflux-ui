import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { useAIChatActiveConversationId } from '~/components/AIChat/hooks/useAIChatActiveConversationId';
import { useAIChatConversationActions } from '~/components/AIChat/hooks/useAIChatConversationActions';
import { useAIChatConversationList } from '~/components/AIChat/hooks/useAIChatConversationList';

export type UseAIChatConversationsResult = {
  activeConversationId: string | null;
  conversations: Conversation[];
  conversationError?: string;
  hasNoSearchResults: boolean;
  isLoadingConversations: boolean;
  refreshConversations: () => Promise<void>;
  startNewChat: () => Promise<boolean>;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
};

export const useAIChatConversations = (): UseAIChatConversationsResult => {
  const activeConversationId = useAIChatActiveConversationId();
  const {
    conversations,
    conversationError: listError,
    hasNoSearchResults,
    isLoadingConversations,
    clearConversationError: clearListError,
    refreshConversations: refreshConversationList,
    filterConversations,
  } = useAIChatConversationList();
  const {
    conversationError: actionError,
    clearConversationError: clearActionError,
    startNewChat: startConversationChat,
    selectConversation: selectActiveConversation,
  } = useAIChatConversationActions();

  const refreshConversations = React.useCallback(async () => {
    clearActionError();
    await refreshConversationList();
  }, [clearActionError, refreshConversationList]);

  const startNewChat = React.useCallback(async (): Promise<boolean> => {
    clearListError();
    return startConversationChat();
  }, [clearListError, startConversationChat]);

  const selectConversation = React.useCallback(
    async (conversationId: string) => {
      clearListError();
      await selectActiveConversation(conversationId);
    },
    [clearListError, selectActiveConversation],
  );

  return {
    activeConversationId,
    conversations,
    conversationError: actionError ?? listError,
    hasNoSearchResults,
    isLoadingConversations,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
  };
};
