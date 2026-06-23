import * as React from 'react';
import ChatbotAlert from '@patternfly/chatbot/dist/dynamic/ChatbotAlert';
import ChatbotContent from '@patternfly/chatbot/dist/dynamic/ChatbotContent';
import ChatbotWelcomePrompt from '@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt';
import Message, { type MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import MessageBox from '@patternfly/chatbot/dist/dynamic/MessageBox';
import {
  KONFLUX_AI_WELCOME_DESCRIPTION,
  KONFLUX_AI_WELCOME_TITLE,
} from '~/components/AIChat/consts';

type AIChatDrawerContentProps = {
  announcement?: string;
  backendError?: string;
  isLoadingConversation: boolean;
  messages: MessageProps[];
};

export const AIChatDrawerContent: React.FC<AIChatDrawerContentProps> = ({
  announcement,
  backendError,
  isLoadingConversation,
  messages,
}) => {
  const scrollToBottomRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (messages.length === 0) {
      return;
    }

    scrollToBottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <ChatbotContent>
      {backendError ? (
        <ChatbotAlert variant="danger" title="Konflux AI is unavailable" isInline>
          {backendError}
        </ChatbotAlert>
      ) : null}
      <MessageBox announcement={announcement}>
        {messages.length === 0 && !isLoadingConversation ? (
          <ChatbotWelcomePrompt
            title={KONFLUX_AI_WELCOME_TITLE}
            description={KONFLUX_AI_WELCOME_DESCRIPTION}
          />
        ) : null}
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            <Message {...message} />
            {index === messages.length - 1 ? <div ref={scrollToBottomRef} /> : null}
          </React.Fragment>
        ))}
      </MessageBox>
    </ChatbotContent>
  );
};
