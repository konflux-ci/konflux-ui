import * as React from 'react';
import type { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { AIChatDrawerContent } from '~/components/AIChat/components/AIChatDrawerContent';
import { AIChatDrawerFooter } from '~/components/AIChat/components/AIChatDrawerFooter';
import { AIChatDrawerHeader } from '~/components/AIChat/components/AIChatDrawerHeader';
import {
  KONFLUX_AI_HISTORY_NO_RESULTS_BODY,
  KONFLUX_AI_HISTORY_NO_RESULTS_TITLE,
  KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER,
} from '~/components/AIChat/const';

type AIChatHistoryNavProps = {
  displayMode: ChatbotDisplayMode;
  activeConversationId: string | null;
  messages: MessageProps[];
  conversations: Conversation[];
  announcement?: string;
  isSendButtonDisabled: boolean;
  isDrawerOpen: boolean;
  isLoadingConversation: boolean;
  hasNoSearchResults: boolean;
  chatError?: string;
  historyMenuKey: number;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refreshConversations: () => Promise<void>;
  startNewChat: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
  sendMessage: (message: string | number) => Promise<void>;
  onCloseChat: () => void;
};

export const AIChatHistoryNav: React.FC<AIChatHistoryNavProps> = ({
  displayMode,
  activeConversationId,
  messages,
  conversations,
  announcement,
  isSendButtonDisabled,
  isDrawerOpen,
  isLoadingConversation,
  hasNoSearchResults,
  chatError,
  historyMenuKey,
  setIsDrawerOpen,
  refreshConversations,
  startNewChat,
  selectConversation,
  filterConversations,
  sendMessage,
  onCloseChat,
}) => {
  const handleToggleDrawer = React.useCallback(() => {
    if (!isDrawerOpen) {
      void refreshConversations();
    }
    setIsDrawerOpen((open) => !open);
  }, [isDrawerOpen, refreshConversations, setIsDrawerOpen]);

  const handleNewChat = React.useCallback(() => {
    setIsDrawerOpen(false);
    void (async () => {
      await startNewChat();
      await refreshConversations();
    })();
  }, [refreshConversations, setIsDrawerOpen, startNewChat]);

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
      key={`chat-history-${historyMenuKey}`}
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
          <AIChatDrawerHeader
            isDrawerOpen={isDrawerOpen}
            onToggleDrawer={handleToggleDrawer}
            onClose={onCloseChat}
          />
          <AIChatDrawerContent
            chatError={chatError}
            announcement={announcement}
            messages={messages}
            isLoadingConversation={isLoadingConversation}
          />
          <AIChatDrawerFooter
            isSendButtonDisabled={isSendButtonDisabled || isLoadingConversation}
            onSendMessage={(message) => {
              void sendMessage(message);
            }}
          />
        </>
      }
    />
  );
};
