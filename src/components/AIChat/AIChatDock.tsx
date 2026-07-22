import * as React from 'react';
import { createPortal } from 'react-dom';
import Chatbot, { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import ChatbotAlert from '@patternfly/chatbot/dist/dynamic/ChatbotAlert';
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
import Message from '@patternfly/chatbot/dist/dynamic/Message';
import MessageBar from '@patternfly/chatbot/dist/dynamic/MessageBar';
import MessageBox from '@patternfly/chatbot/dist/dynamic/MessageBox';
import KonfluxLogo from '~/assets/konflux-logo.svg';
import { CHAT_MESSAGE_REHYPE_PLUGINS } from '~/components/AIChat/chatMessagePlugins';
import {
  KONFLUX_AI_FOOTNOTE,
  KONFLUX_AI_MESSAGE_PLACEHOLDER,
  KONFLUX_AI_TOGGLE_BUTTON_LABEL,
  KONFLUX_AI_TOGGLE_TOOLTIP,
  KONFLUX_AI_WELCOME_DESCRIPTION,
  KONFLUX_AI_WELCOME_TITLE,
} from '~/components/AIChat/consts';
import { useLightspeedChat } from '~/components/AIChat/hooks/useLightspeedChat';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

const displayMode = ChatbotDisplayMode.default;

/**
 * PatternFly chatbot dock with Lightspeed SSE send/receive.
 */
export const AIChatDock: React.FC = () => {
  const [isChatbotVisible, setIsChatbotVisible] = React.useState(false);
  const scrollToBottomRef = React.useRef<HTMLDivElement>(null);
  const {
    messages,
    announcement,
    isSendButtonDisabled,
    isInitializing,
    backendError,
    sendMessage,
  } = useLightspeedChat();

  React.useLayoutEffect(() => {
    if (messages.length === 0) {
      return;
    }
    scrollToBottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return createPortal(
    <div className="konflux-ai-chat" data-test="ai-chat-dock">
      <ChatbotToggle
        tooltipLabel={KONFLUX_AI_TOGGLE_TOOLTIP}
        toggleButtonLabel={KONFLUX_AI_TOGGLE_BUTTON_LABEL}
        isChatbotVisible={isChatbotVisible}
        onToggleChatbot={() => setIsChatbotVisible((visible) => !visible)}
      />
      <Chatbot displayMode={displayMode} isVisible={isChatbotVisible}>
        <ChatbotHeader>
          <ChatbotHeaderMain>
            <ChatbotHeaderTitle>
              <KonfluxLogo
                aria-label="Konflux"
                className="konflux-ai-chat__brand"
                height={36}
              />
            </ChatbotHeaderTitle>
          </ChatbotHeaderMain>
          <ChatbotHeaderActions>
            <ChatbotHeaderCloseButton onClick={() => setIsChatbotVisible(false)} />
          </ChatbotHeaderActions>
        </ChatbotHeader>
        <ChatbotContent>
          {backendError ? (
            <ChatbotAlert variant="danger" title="Konflux AI is unavailable" isInline>
              {backendError}
            </ChatbotAlert>
          ) : null}
          <MessageBox announcement={announcement}>
            {messages.length === 0 && !isInitializing ? (
              <ChatbotWelcomePrompt
                title={KONFLUX_AI_WELCOME_TITLE}
                description={KONFLUX_AI_WELCOME_DESCRIPTION}
              />
            ) : null}
            {messages.map((message, index) => (
              <React.Fragment key={message.id}>
                <Message {...message} additionalRehypePlugins={CHAT_MESSAGE_REHYPE_PLUGINS} />
                {index === messages.length - 1 ? <div ref={scrollToBottomRef} /> : null}
              </React.Fragment>
            ))}
          </MessageBox>
        </ChatbotContent>
        <ChatbotFooter>
          <MessageBar
            hasAttachButton={false}
            isSendButtonDisabled={isSendButtonDisabled}
            onSendMessage={(message) => {
              void sendMessage(message);
            }}
            placeholder={KONFLUX_AI_MESSAGE_PLACEHOLDER}
          />
          <ChatbotFootnote label={KONFLUX_AI_FOOTNOTE} />
        </ChatbotFooter>
      </Chatbot>
    </div>,
    document.body,
  );
};
