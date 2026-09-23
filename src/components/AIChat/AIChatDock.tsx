import * as React from 'react';
import { AIStateProvider, useInProgress } from '@redhat-cloud-services/ai-react-state';
import { AIChatFooter } from '~/components/AIChat/components/AIChatFooter';
import { AIChatHistoryNav } from '~/components/AIChat/components/AIChatHistoryNav';
import { AIChatMessageList } from '~/components/AIChat/components/AIChatMessageList';
import { AIChatPanel } from '~/components/AIChat/components/AIChatPanel';
import { AIChatToggle } from '~/components/AIChat/components/AIChatToggle';
import { KONFLUX_AI_DISPLAY_MODE } from '~/components/AIChat/const';
import { useAIChatConversations } from '~/components/AIChat/hooks/useAIChatConversations';
import { useAIChatInit } from '~/components/AIChat/hooks/useAIChatInit';
import { useAIChatSend } from '~/components/AIChat/hooks/useAIChatSend';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';
import { useToggle } from '~/shared/hooks/useToggle';
import { AIChatPortal } from './AIChatPortal';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

const AIChatDockContent: React.FC = () => {
  const [isVisible, toggle] = useToggle();
  const { initError, isInitializing, retryInit } = useAIChatInit();
  const { sendError, clearSendError, sendMessage } = useAIChatSend();
  const {
    activeConversationId,
    conversations,
    isDrawerOpen,
    hasNoSearchResults,
    setIsDrawerOpen,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
  } = useAIChatConversations();
  const isInProgress = useInProgress();

  const handleToggle = React.useCallback(() => {
    if (!isVisible) {
      clearSendError();
      if (initError) {
        retryInit();
      }
    }
    toggle();
  }, [clearSendError, initError, isVisible, retryInit, toggle]);

  const chatError = sendError ?? initError;
  const isSendDisabled = isInProgress || !!initError || isInitializing;

  return (
    <AIChatPortal>
      <div className="ai-chat" data-test="ai-chat-dock">
        <AIChatToggle isVisible={isVisible} onToggle={handleToggle} />
        <AIChatPanel isVisible={isVisible}>
          <AIChatHistoryNav
            displayMode={KONFLUX_AI_DISPLAY_MODE}
            activeConversationId={activeConversationId}
            conversations={conversations}
            isDrawerOpen={isDrawerOpen}
            hasNoSearchResults={hasNoSearchResults}
            setIsDrawerOpen={setIsDrawerOpen}
            refreshConversations={refreshConversations}
            startNewChat={startNewChat}
            selectConversation={selectConversation}
            filterConversations={filterConversations}
            onCloseChat={toggle}
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
