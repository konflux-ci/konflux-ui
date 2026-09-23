import * as React from 'react';
import { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import { AIStateProvider, useInProgress } from '@redhat-cloud-services/ai-react-state';
import { AIChatDeleteConversationModal } from '~/components/AIChat/components/AIChatDeleteConversationModal';
import { AIChatFooter } from '~/components/AIChat/components/AIChatFooter';
import { AIChatHistoryNav } from '~/components/AIChat/components/AIChatHistoryNav';
import { AIChatMessageList } from '~/components/AIChat/components/AIChatMessageList';
import { AIChatPanel } from '~/components/AIChat/components/AIChatPanel';
import { AIChatRenameConversationModal } from '~/components/AIChat/components/AIChatRenameConversationModal';
import { AIChatToggle } from '~/components/AIChat/components/AIChatToggle';
import { KONFLUX_AI_DEFAULT_DISPLAY_MODE } from '~/components/AIChat/const';
import { useAIChatConversations } from '~/components/AIChat/hooks/useAIChatConversations';
import { useAIChatInit } from '~/components/AIChat/hooks/useAIChatInit';
import { useAIChatSend } from '~/components/AIChat/hooks/useAIChatSend';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';
import { useToggle } from '~/shared/hooks/useToggle';
import { AIChatPortal, getAIChatPortalContainer } from './AIChatPortal';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

const AIChatDockContent: React.FC = () => {
  const [isVisible, toggle] = useToggle();
  const [displayMode, setDisplayMode] = React.useState(KONFLUX_AI_DEFAULT_DISPLAY_MODE);
  const isMaximized = displayMode === ChatbotDisplayMode.fullscreen;
  const { initError, isInitializing, retryInit } = useAIChatInit();
  const { sendError, clearSendError, sendMessage } = useAIChatSend();
  const {
    activeConversationId,
    conversations,
    conversationError,
    deleteConversationTarget,
    hasNoSearchResults,
    isDeletingConversation,
    isLoadingConversations,
    isRenamingConversation,
    renameConversationTarget,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
    clearConversationError,
    closeDeleteConversation,
    closeRenameConversation,
    confirmDeleteConversation,
    confirmRenameConversation,
  } = useAIChatConversations();
  const isInProgress = useInProgress();

  const handleToggle = React.useCallback(() => {
    if (!isVisible) {
      clearSendError();
      clearConversationError();
      if (initError) {
        retryInit();
      }
    }
    toggle();
  }, [clearConversationError, clearSendError, initError, isVisible, retryInit, toggle]);

  const handleToggleDisplayMode = React.useCallback(() => {
    setDisplayMode((mode) =>
      mode === ChatbotDisplayMode.fullscreen
        ? ChatbotDisplayMode.default
        : ChatbotDisplayMode.fullscreen,
    );
  }, []);

  const handleCloseChat = React.useCallback(() => {
    setDisplayMode(KONFLUX_AI_DEFAULT_DISPLAY_MODE);
    toggle();
  }, [toggle]);

  const chatError = sendError ?? initError ?? conversationError;
  const isSendDisabled = isInProgress || !!initError || isInitializing;

  return (
    <AIChatPortal>
      <div className="ai-chat" data-test="ai-chat-dock">
        <AIChatToggle isVisible={isVisible} onToggle={handleToggle} />
        <AIChatPanel isVisible={isVisible} displayMode={displayMode}>
          <AIChatHistoryNav
            displayMode={displayMode}
            isMaximized={isMaximized}
            activeConversationId={activeConversationId}
            conversations={conversations}
            conversationError={conversationError}
            hasNoSearchResults={hasNoSearchResults}
            isLoadingConversations={isLoadingConversations}
            refreshConversations={refreshConversations}
            startNewChat={startNewChat}
            selectConversation={selectConversation}
            filterConversations={filterConversations}
            onToggleDisplayMode={handleToggleDisplayMode}
            onCloseChat={handleCloseChat}
          >
            <AIChatMessageList isInitializing={isInitializing} chatError={chatError} />
            <AIChatFooter
              isSendDisabled={isSendDisabled}
              onSend={(message) => {
                void sendMessage(message).then(() => refreshConversations());
              }}
            />
          </AIChatHistoryNav>
        </AIChatPanel>
        <AIChatDeleteConversationModal
          appendTo={getAIChatPortalContainer}
          currentName={deleteConversationTarget?.currentName ?? ''}
          errorMessage={deleteConversationTarget ? conversationError : undefined}
          isOpen={deleteConversationTarget !== null}
          isSubmitting={isDeletingConversation}
          onClose={closeDeleteConversation}
          onDelete={() => {
            void confirmDeleteConversation();
          }}
        />
        <AIChatRenameConversationModal
          appendTo={getAIChatPortalContainer}
          currentName={renameConversationTarget?.currentName ?? ''}
          errorMessage={renameConversationTarget ? conversationError : undefined}
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

/** PatternFly chatbot dock backed by the Red Hat AI state provider. */
const AIChatDock: React.FC = () => (
  <AIStateProvider client={getLightspeedClient()}>
    <AIChatDockContent />
  </AIStateProvider>
);

export default AIChatDock;
