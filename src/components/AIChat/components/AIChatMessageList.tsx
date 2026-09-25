import * as React from 'react';
import ChatbotAlert from '@patternfly/chatbot/dist/dynamic/ChatbotAlert';
import ChatbotContent from '@patternfly/chatbot/dist/dynamic/ChatbotContent';
import ChatbotWelcomePrompt from '@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import Message from '@patternfly/chatbot/dist/dynamic/Message';
import MessageBox from '@patternfly/chatbot/dist/dynamic/MessageBox';
import { CHAT_MESSAGE_REHYPE_PLUGINS } from '~/components/AIChat/chatMessagePlugins';
import {
  KONFLUX_AI_ERROR_TITLE,
  KONFLUX_AI_WELCOME_DESCRIPTION,
  KONFLUX_AI_WELCOME_TITLE,
} from '~/components/AIChat/const';
import { useScrollToBottom } from '~/shared/hooks/useScrollToBottom';

type AIChatMessageListProps = {
  messages: MessageProps[];
  announcement?: string;
  isInitializing: boolean;
  chatError?: string;
};

/**
 * Renders chat messages, welcome prompt, error alert, and auto-scrolls on updates.
 */
export const AIChatMessageList: React.FC<AIChatMessageListProps> = ({
  messages,
  announcement,
  isInitializing,
  chatError,
}) => {
  const scrollToBottomRef = useScrollToBottom(messages);

  return (
    <ChatbotContent>
      {chatError ? (
        <ChatbotAlert variant="danger" title={KONFLUX_AI_ERROR_TITLE} isInline>
          {chatError}
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
  );
};
