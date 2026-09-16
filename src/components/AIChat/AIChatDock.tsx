import * as React from 'react';
import Chatbot, { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotToggle from '@patternfly/chatbot/dist/dynamic/ChatbotToggle';
import { AIChatPortal, getAIChatPortalContainer } from '~/components/AIChat/AIChatPortal';
import { AIChatHistoryNav } from '~/components/AIChat/components/AIChatHistoryNav';
import { AIChatRenameConversationModal } from '~/components/AIChat/components/AIChatRenameConversationModal';
import {
  KONFLUX_AI_DEFAULT_DISPLAY_MODE,
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
    chatError,
    clearChatError,
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

  React.useEffect(() => {
    if (!isChatbotVisible) {
      clearChatError();
    }
  }, [clearChatError, isChatbotVisible]);

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
          <AIChatHistoryNav
            displayMode={displayMode}
            isMaximized={isMaximized}
            activeConversationId={activeConversationId}
            messages={messages}
            conversations={conversations}
            announcement={announcement}
            isSendButtonDisabled={isSendButtonDisabled}
            isDrawerOpen={isDrawerOpen}
            isLoadingConversation={isLoadingConversation}
            hasNoSearchResults={hasNoSearchResults}
            chatError={chatError}
            historyMenuKey={historyMenuKey}
            setIsDrawerOpen={setIsDrawerOpen}
            refreshConversations={refreshConversations}
            startNewChat={startNewChat}
            selectConversation={selectConversation}
            filterConversations={filterConversations}
            sendMessage={sendMessage}
            onToggleDisplayMode={handleToggleDisplayMode}
            onCloseChat={handleCloseChat}
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
