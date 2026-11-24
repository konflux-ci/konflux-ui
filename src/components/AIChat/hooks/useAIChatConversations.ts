import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { useAIChatActiveConversationId } from '~/components/AIChat/hooks/useAIChatActiveConversationId';
import { useAIChatConversationActions } from '~/components/AIChat/hooks/useAIChatConversationActions';
import { useAIChatConversationList } from '~/components/AIChat/hooks/useAIChatConversationList';

type UseAIChatConversationsResult = {
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
  const [conversationError, setConversationError] = React.useState<string>();
  const activeConversationId = useAIChatActiveConversationId();
  const {
    conversations,
    hasNoSearchResults,
    isLoadingConversations,
    refreshConversations,
    filterConversations,
  } = useAIChatConversationList({ setConversationError });
  const { startNewChat, selectConversation } = useAIChatConversationActions({
    setConversationError,
  });

  return {
    activeConversationId,
    conversations,
    conversationError,
    hasNoSearchResults,
    isLoadingConversations,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
  };
};
