import * as React from 'react';
import { createPortal } from 'react-dom';
import Chatbot, { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import ChatbotToggle from '@patternfly/chatbot/dist/dynamic/ChatbotToggle';
import { AIChatDrawerContent } from '~/components/AIChat/components/AIChatDrawerContent';
import { AIChatDrawerFooter } from '~/components/AIChat/components/AIChatDrawerFooter';
import { AIChatDrawerHeader } from '~/components/AIChat/components/AIChatDrawerHeader';
import { AIChatRenameConversationModal } from '~/components/AIChat/components/AIChatRenameConversationModal';
import {
  KONFLUX_AI_TOGGLE_BUTTON_LABEL,
  KONFLUX_AI_TOGGLE_TOOLTIP,
} from '~/components/AIChat/consts';
import { useLightspeedChat } from '~/components/AIChat/hooks/useLightspeedChat';

import '@patternfly/react-core-v6/dist/styles/base-no-reset.css';
import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

const displayMode = ChatbotDisplayMode.default;

export const AIChatDock: React.FC = () => {
  const [isChatbotVisible, setIsChatbotVisible] = React.useState(false);
  const chatRootRef = React.useRef<HTMLDivElement>(null);
  const {
    activeConversationId,
    messages,
    conversations,
    announcement,
    isSendButtonDisabled,
    isDrawerOpen,
    isLoadingConversation,
    isRenamingConversation,
    backendError,
    renameConversationTarget,
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

  return createPortal(
    <div ref={chatRootRef} className="pf-v6 pf-v6-m-legacy-font konflux-ai-chat">
      <ChatbotToggle
        className="konflux-ai-chat__toggle"
        tooltipLabel={KONFLUX_AI_TOGGLE_TOOLTIP}
        toggleButtonLabel={KONFLUX_AI_TOGGLE_BUTTON_LABEL}
        isChatbotVisible={isChatbotVisible}
        onToggleChatbot={() => setIsChatbotVisible((visible) => !visible)}
      />
      <Chatbot
        className="konflux-ai-chat__panel"
        displayMode={displayMode}
        isVisible={isChatbotVisible}
      >
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
          searchInputPlaceholder="Search conversations"
          drawerContent={
            <>
              <AIChatDrawerHeader
                isDrawerOpen={isDrawerOpen}
                onToggleDrawer={handleToggleDrawer}
                onClose={() => setIsChatbotVisible(false)}
              />
              <AIChatDrawerContent
                backendError={backendError}
                announcement={announcement}
                messages={messages}
                isLoadingConversation={isLoadingConversation}
              />
              <AIChatDrawerFooter
                isSendButtonDisabled={isSendButtonDisabled || isLoadingConversation}
                onSendMessage={sendMessage}
              />
            </>
          }
        />
      </Chatbot>
      <AIChatRenameConversationModal
        appendTo={() => chatRootRef.current ?? document.body}
        currentName={renameConversationTarget?.currentName ?? ''}
        isOpen={renameConversationTarget !== null}
        isSubmitting={isRenamingConversation}
        onClose={closeRenameConversation}
        onRename={(newName) => {
          void confirmRenameConversation(newName);
        }}
      />
    </div>,
    document.body,
  );
};
