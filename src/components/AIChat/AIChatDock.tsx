import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Chatbot from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotContent from '@patternfly/chatbot/dist/dynamic/ChatbotContent';
import ChatbotFooter, { ChatbotFootnote } from '@patternfly/chatbot/dist/dynamic/ChatbotFooter';
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';
import ChatbotToggle from '@patternfly/chatbot/dist/dynamic/ChatbotToggle';
import ChatbotWelcomePrompt from '@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt';
import MessageBar from '@patternfly/chatbot/dist/dynamic/MessageBar';
import MessageBox from '@patternfly/chatbot/dist/dynamic/MessageBox';
import KonfluxLogo from '~/assets/konflux-logo.svg';
import {
  KONFLUX_AI_DISPLAY_MODE,
  KONFLUX_AI_FOOTNOTE,
  KONFLUX_AI_MESSAGE_PLACEHOLDER,
  KONFLUX_AI_TOGGLE_BUTTON_LABEL,
  KONFLUX_AI_TOGGLE_TOOLTIP,
  KONFLUX_AI_WELCOME_DESCRIPTION,
  KONFLUX_AI_WELCOME_TITLE,
} from '~/components/AIChat/const';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

/**
 * Basic PatternFly chatbot shell with no backend/send behavior.
 */
export const AIChatDock: React.FC = () => {
  const [isChatbotVisible, setIsChatbotVisible] = React.useState(false);

  return ReactDOM.createPortal(
    <div className="ai-chat" data-test="ai-chat-dock">
      <ChatbotToggle
        tooltipLabel={KONFLUX_AI_TOGGLE_TOOLTIP}
        toggleButtonLabel={KONFLUX_AI_TOGGLE_BUTTON_LABEL}
        isChatbotVisible={isChatbotVisible}
        onToggleChatbot={() => setIsChatbotVisible((visible) => !visible)}
      />
      <Chatbot displayMode={KONFLUX_AI_DISPLAY_MODE} isVisible={isChatbotVisible}>
        <ChatbotHeader>
          <ChatbotHeaderMain>
            <ChatbotHeaderTitle>
              <KonfluxLogo
                aria-label="Konflux"
                className="ai-chat__brand"
                height={36}
              />
            </ChatbotHeaderTitle>
          </ChatbotHeaderMain>
          <ChatbotHeaderActions>
            <ChatbotHeaderCloseButton onClick={() => setIsChatbotVisible(false)} />
          </ChatbotHeaderActions>
        </ChatbotHeader>
        <ChatbotContent>
          <MessageBox>
            <ChatbotWelcomePrompt
              title={KONFLUX_AI_WELCOME_TITLE}
              description={KONFLUX_AI_WELCOME_DESCRIPTION}
            />
          </MessageBox>
        </ChatbotContent>
        <ChatbotFooter>
          <MessageBar
            hasAttachButton={false}
            onSendMessage={() => undefined}
            placeholder={KONFLUX_AI_MESSAGE_PLACEHOLDER}
          />
          <ChatbotFootnote label={KONFLUX_AI_FOOTNOTE} />
        </ChatbotFooter>
      </Chatbot>
    </div>,
    document.body,
  );
};
