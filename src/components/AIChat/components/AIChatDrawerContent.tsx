import * as React from 'react';
import ChatbotAlert from '@patternfly/chatbot/dist/dynamic/ChatbotAlert';
import ChatbotContent from '@patternfly/chatbot/dist/dynamic/ChatbotContent';
import ChatbotWelcomePrompt from '@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt';
import Message, { type MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import MessageBox, { type MessageBoxHandle } from '@patternfly/chatbot/dist/dynamic/MessageBox';
import { CHAT_MESSAGE_REHYPE_PLUGINS } from '~/components/AIChat/chatMessagePlugins';
import {
  KONFLUX_AI_WELCOME_DESCRIPTION,
  KONFLUX_AI_WELCOME_TITLE,
} from '~/components/AIChat/consts';

type AIChatDrawerContentProps = {
  announcement?: string;
  backendError?: string;
  isLoadingConversation: boolean;
  messages: MessageProps[];
  streamingMessage?: MessageProps | null;
};

export const AIChatDrawerContent: React.FC<AIChatDrawerContentProps> = ({
  announcement,
  backendError,
  isLoadingConversation,
  messages,
  streamingMessage,
}) => {
  const messageBoxRef = React.useRef<MessageBoxHandle>(null);
  const scrollQueuedRef = React.useRef(false);
  const streamingContent = streamingMessage?.content ?? '';

  React.useLayoutEffect(() => {
    if (messages.length === 0 && !streamingMessage) {
      return undefined;
    }

    const messageBox = messageBoxRef.current;
    if (!messageBox || scrollQueuedRef.current) {
      return undefined;
    }

    if (!messageBox.isSmartScrollActive()) {
      return undefined;
    }

    scrollQueuedRef.current = true;
    const rafId = requestAnimationFrame(() => {
      messageBox.scrollToBottom({
        behavior: streamingMessage ? 'auto' : 'smooth',
        resumeSmartScroll: Boolean(streamingMessage),
      });
      scrollQueuedRef.current = false;
    });

    return () => {
      cancelAnimationFrame(rafId);
      scrollQueuedRef.current = false;
    };
  }, [messages, streamingMessage, streamingContent]);

  const hasMessages = messages.length > 0 || !!streamingMessage;

  return (
    <ChatbotContent>
      {backendError ? (
        <ChatbotAlert variant="danger" title="Konflux AI is unavailable" isInline>
          {backendError}
        </ChatbotAlert>
      ) : null}
      <MessageBox announcement={announcement} enableSmartScroll ref={messageBoxRef}>
        {!hasMessages && !isLoadingConversation ? (
          <ChatbotWelcomePrompt
            title={KONFLUX_AI_WELCOME_TITLE}
            description={KONFLUX_AI_WELCOME_DESCRIPTION}
          />
        ) : null}
        {messages.map((message) => (
          <Message
            key={message.id}
            {...message}
            additionalRehypePlugins={CHAT_MESSAGE_REHYPE_PLUGINS}
          />
        ))}
        {streamingMessage ? (
          <Message
            key={streamingMessage.id}
            {...streamingMessage}
            additionalRehypePlugins={CHAT_MESSAGE_REHYPE_PLUGINS}
          />
        ) : null}
      </MessageBox>
    </ChatbotContent>
  );
};
