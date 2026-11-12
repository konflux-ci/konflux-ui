import * as React from 'react';
import { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';
import {
  KONFLUX_AI_ERROR_TITLE,
  KONFLUX_AI_HISTORY_NO_RESULTS_BODY,
  KONFLUX_AI_HISTORY_NO_RESULTS_TITLE,
  KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER,
} from '~/components/AIChat/const';

type AIChatHistoryNavProps = {
  displayMode: ChatbotDisplayMode;
  activeConversationId: string | null;
  conversations: Conversation[];
  conversationError?: string;
  hasNoSearchResults: boolean;
  isLoadingConversations: boolean;
  refreshConversations: () => Promise<void>;
  startNewChat: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
  onToggleDisplayMode: () => void;
  onCloseChat: () => void;
  children: React.ReactNode;
};

/** History drawer for searching, selecting, and starting conversations. */
export const AIChatHistoryNav: React.FC<AIChatHistoryNavProps> = ({
  displayMode,
  activeConversationId,
  conversations,
  conversationError,
  hasNoSearchResults,
  isLoadingConversations,
  refreshConversations,
  startNewChat,
  selectConversation,
  filterConversations,
  onToggleDisplayMode,
  onCloseChat,
  children,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const handleToggleDrawer = React.useCallback(() => {
    if (!isDrawerOpen) {
      void refreshConversations();
    }
    setIsDrawerOpen((open) => !open);
  }, [isDrawerOpen, refreshConversations]);

  const handleNewChat = React.useCallback(() => {
    setIsDrawerOpen(false);
    void startNewChat().then(() => refreshConversations());
  }, [refreshConversations, startNewChat]);

  const handleSelectConversation = React.useCallback(
    (_event: React.MouseEvent | undefined, conversationId?: string | number) => {
      if (conversationId === undefined) {
        return;
      }
      void selectConversation(String(conversationId));
      setIsDrawerOpen(false);
    },
    [selectConversation, setIsDrawerOpen],
  );

  const isMaximized = displayMode === ChatbotDisplayMode.fullscreen;

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
            isMaximized={isMaximized}
            onToggleDrawer={handleToggleDrawer}
            onToggleDisplayMode={onToggleDisplayMode}
            onClose={onCloseChat}
          />
          {children}
        </>
      }
    />
  );
};
