import * as React from 'react';
import type { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';
import {
  KONFLUX_AI_ERROR_TITLE,
  KONFLUX_AI_HISTORY_NO_RESULTS_BODY,
  KONFLUX_AI_HISTORY_NO_RESULTS_TITLE,
  KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER,
} from '~/components/AIChat/const';
import type { UseAIChatConversationsResult } from '~/components/AIChat/hooks/useAIChatConversations';
import { useAIChatHistoryDrawer } from '~/components/AIChat/hooks/useAIChatHistoryDrawer';

type AIChatHistoryNavProps = {
  displayMode: ChatbotDisplayMode;
  history: UseAIChatConversationsResult;
  onCloseChat: () => void;
  children: React.ReactNode;
};

export const AIChatHistoryNav: React.FC<AIChatHistoryNavProps> = ({
  displayMode,
  history,
  onCloseChat,
  children,
}) => {
  const {
    activeConversationId,
    conversations,
    conversationError,
    hasNoSearchResults,
    isLoadingConversations,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
  } = history;
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    handleToggleDrawer,
    handleNewChat,
    handleSelectConversation,
  } = useAIChatHistoryDrawer({
    refreshConversations,
    startNewChat,
    selectConversation,
  });

  return (
    <ChatbotConversationHistoryNav
      displayMode={displayMode}
      onDrawerToggle={handleToggleDrawer}
      isDrawerOpen={isDrawerOpen}
      setIsDrawerOpen={setIsDrawerOpen}
      activeItemId={activeConversationId ?? undefined}
      onSelectActiveItem={handleSelectConversation}
      conversations={conversations}
      isLoading={isLoadingConversations}
      errorState={
        conversationError
          ? { titleText: KONFLUX_AI_ERROR_TITLE, bodyText: conversationError }
          : undefined
      }
      onNewChat={handleNewChat}
      handleTextInputChange={filterConversations}
      searchInputPlaceholder={KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER}
      noResultsState={
        hasNoSearchResults
          ? {
              titleText: KONFLUX_AI_HISTORY_NO_RESULTS_TITLE,
              bodyText: KONFLUX_AI_HISTORY_NO_RESULTS_BODY,
            }
          : undefined
      }
      drawerContent={
        <>
          <AIChatHeader
            isDrawerOpen={isDrawerOpen}
            onToggleDrawer={handleToggleDrawer}
            onClose={onCloseChat}
          />
          {children}
        </>
      }
    />
  );
};
