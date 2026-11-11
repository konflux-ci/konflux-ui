import * as React from 'react';
import type { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';
import {
  KONFLUX_AI_HISTORY_NO_RESULTS_BODY,
  KONFLUX_AI_HISTORY_NO_RESULTS_TITLE,
  KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER,
} from '~/components/AIChat/const';

type AIChatHistoryNavProps = {
  displayMode: ChatbotDisplayMode;
  activeConversationId: string | null;
  conversations: Conversation[];
  hasNoSearchResults: boolean;
  refreshConversations: () => Promise<void>;
  startNewChat: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
  onCloseChat: () => void;
  children: React.ReactNode;
};

export const AIChatHistoryNav: React.FC<AIChatHistoryNavProps> = ({
  displayMode,
  activeConversationId,
  conversations,
  hasNoSearchResults,
  refreshConversations,
  startNewChat,
  selectConversation,
  filterConversations,
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

  return (
    <ChatbotConversationHistoryNav
      displayMode={displayMode}
      onDrawerToggle={handleToggleDrawer}
      isDrawerOpen={isDrawerOpen}
      setIsDrawerOpen={setIsDrawerOpen}
      activeItemId={activeConversationId ?? undefined}
      onSelectActiveItem={handleSelectConversation}
      conversations={conversations}
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
