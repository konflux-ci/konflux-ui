import * as React from 'react';
import Chatbot from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotToggle from '@patternfly/chatbot/dist/dynamic/ChatbotToggle';
import { AIChatPortal } from '~/components/AIChat/AIChatPortal';
import { AIChatHistoryNav } from '~/components/AIChat/components/AIChatHistoryNav';
import {
  KONFLUX_AI_DISPLAY_MODE,
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
  const {
    activeConversationId,
    messages,
    conversations,
    announcement,
    isSendButtonDisabled,
    isDrawerOpen,
    isLoadingConversation,
    hasNoSearchResults,
    chatError,
    clearChatError,
    setIsDrawerOpen,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
    sendMessage,
  } = useLightspeedChat();

  React.useEffect(() => {
    if (!isChatbotVisible) {
      clearChatError();
    }
  }, [clearChatError, isChatbotVisible]);

  return (
    <AIChatPortal>
      <div className="ai-chat" data-test="ai-chat-dock">
        <ChatbotToggle
          tooltipLabel={KONFLUX_AI_TOGGLE_TOOLTIP}
          toggleButtonLabel={KONFLUX_AI_TOGGLE_BUTTON_LABEL}
          isChatbotVisible={isChatbotVisible}
          onToggleChatbot={() => setIsChatbotVisible((visible) => !visible)}
        />
        <Chatbot displayMode={KONFLUX_AI_DISPLAY_MODE} isVisible={isChatbotVisible}>
          <AIChatHistoryNav
            displayMode={KONFLUX_AI_DISPLAY_MODE}
            activeConversationId={activeConversationId}
            messages={messages}
            conversations={conversations}
            announcement={announcement}
            isSendButtonDisabled={isSendButtonDisabled}
            isDrawerOpen={isDrawerOpen}
            isLoadingConversation={isLoadingConversation}
            hasNoSearchResults={hasNoSearchResults}
            chatError={chatError}
            setIsDrawerOpen={setIsDrawerOpen}
            refreshConversations={refreshConversations}
            startNewChat={startNewChat}
            selectConversation={selectConversation}
            filterConversations={filterConversations}
            sendMessage={sendMessage}
            onCloseChat={() => setIsChatbotVisible(false)}
          />
        </Chatbot>
      </div>
    </AIChatPortal>
  );
};
