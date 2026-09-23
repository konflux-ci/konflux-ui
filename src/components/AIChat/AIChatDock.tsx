import * as React from 'react';
import Chatbot from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotToggle from '@patternfly/chatbot/dist/dynamic/ChatbotToggle';
import { AIChatPortal } from '~/components/AIChat/AIChatPortal';
import { AIChatDrawerContent } from '~/components/AIChat/components/AIChatDrawerContent';
import { AIChatDrawerFooter } from '~/components/AIChat/components/AIChatDrawerFooter';
import { AIChatDrawerHeader } from '~/components/AIChat/components/AIChatDrawerHeader';
import {
  KONFLUX_AI_DISPLAY_MODE,
  KONFLUX_AI_TOGGLE_BUTTON_LABEL,
  KONFLUX_AI_TOGGLE_TOOLTIP,
} from '~/components/AIChat/const';
import { useLightspeedChat } from '~/lightspeed/useLightspeedChat';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

/**
 * PatternFly chatbot dock with Lightspeed SSE send/receive.
 * Header, content, and footer are split into dedicated drawer components.
 */
export const AIChatDock: React.FC = () => {
  const [isChatbotVisible, setIsChatbotVisible] = React.useState(false);
  const {
    messages,
    announcement,
    isSendButtonDisabled,
    isInitializing,
    chatError,
    clearChatError,
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
          <AIChatDrawerHeader onClose={() => setIsChatbotVisible(false)} />
          <AIChatDrawerContent
            announcement={announcement}
            chatError={chatError}
            isLoadingConversation={isInitializing}
            messages={messages}
          />
          <AIChatDrawerFooter
            isSendButtonDisabled={isSendButtonDisabled || isInitializing}
            onSendMessage={(message) => {
              void sendMessage(String(message));
            }}
          />
        </Chatbot>
      </div>
    </AIChatPortal>
  );
};
