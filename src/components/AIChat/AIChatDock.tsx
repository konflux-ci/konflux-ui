import * as React from 'react';
import Chatbot, { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import ChatbotToggle from '@patternfly/chatbot/dist/dynamic/ChatbotToggle';
import { AIChatPortal, getAIChatPortalContainer } from '~/components/AIChat/AIChatPortal';
import { AIChatDrawerContent } from '~/components/AIChat/components/AIChatDrawerContent';
import { AIChatDrawerFooter } from '~/components/AIChat/components/AIChatDrawerFooter';
import { AIChatDrawerHeader } from '~/components/AIChat/components/AIChatDrawerHeader';
import { AIChatRenameConversationModal } from '~/components/AIChat/components/AIChatRenameConversationModal';
import {
  KONFLUX_AI_DEFAULT_DISPLAY_MODE,
  KONFLUX_AI_HISTORY_NO_RESULTS_BODY,
  KONFLUX_AI_HISTORY_NO_RESULTS_TITLE,
  KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER,
  KONFLUX_AI_TOGGLE_BUTTON_LABEL,
  KONFLUX_AI_TOGGLE_TOOLTIP,
} from '~/components/AIChat/const';
import { useLightspeedChat } from '~/lightspeed/useLightspeedChat';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

/**
 * PatternFly chatbot dock with Lightspeed SSE send/receive and conversation history.
 */
export const AIChatDock: React.FC = () => {
  const [isChatbotVisible, setIsChatbotVisible] = React.useState(false);
  const [displayMode, setDisplayMode] = React.useState(KONFLUX_AI_DEFAULT_DISPLAY_MODE);
  const isMaximized = displayMode === ChatbotDisplayMode.fullscreen;
  const {
    activeConversationId,
    messages,
    conversations,
    announcement,
    isSendButtonDisabled,
    isDrawerOpen,
    isLoadingConversation,
    isRenamingConversation,
    hasNoSearchResults,
    backendError,
    renameConversationTarget,
    historyMenuKey,
    setIsDrawerOpen,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
    sendMessage,
    closeRenameConversation,
    confirmRenameConversation,
  } = useLightspeedChat();

  const handleToggleDrawer = React.useCallback(() => {
    setIsDrawerOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) {
        void refreshConversations();
      }
      return nextOpen;
    });
  }, [refreshConversations, setIsDrawerOpen]);

  const handleNewChat = React.useCallback(() => {
    startNewChat();
    setIsDrawerOpen(false);
    void refreshConversations();
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

  const handleToggleDisplayMode = React.useCallback(() => {
    setDisplayMode((mode) =>
      mode === ChatbotDisplayMode.fullscreen
        ? ChatbotDisplayMode.default
        : ChatbotDisplayMode.fullscreen,
    );
  }, []);

  const handleCloseChat = React.useCallback(() => {
    setIsChatbotVisible(false);
    setDisplayMode(KONFLUX_AI_DEFAULT_DISPLAY_MODE);
  }, []);

  return (
    <AIChatPortal>
      <div className="ai-chat" data-test="ai-chat-dock">
        <ChatbotToggle
          tooltipLabel={KONFLUX_AI_TOGGLE_TOOLTIP}
          toggleButtonLabel={KONFLUX_AI_TOGGLE_BUTTON_LABEL}
          isChatbotVisible={isChatbotVisible}
          onToggleChatbot={() => setIsChatbotVisible((visible) => !visible)}
        />
        <Chatbot displayMode={displayMode} isVisible={isChatbotVisible}>
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
                  isMaximized={isMaximized}
                  onToggleDrawer={handleToggleDrawer}
                  onToggleDisplayMode={handleToggleDisplayMode}
                  onClose={handleCloseChat}
                />
                <AIChatDrawerContent
                  backendError={backendError}
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
        </Chatbot>
        <AIChatRenameConversationModal
          appendTo={getAIChatPortalContainer}
          currentName={renameConversationTarget?.currentName ?? ''}
          isOpen={renameConversationTarget !== null}
          isSubmitting={isRenamingConversation}
          onClose={closeRenameConversation}
          onRename={(newName) => {
            void confirmRenameConversation(newName);
          }}
        />
      </div>
    </AIChatPortal>
  );
};
