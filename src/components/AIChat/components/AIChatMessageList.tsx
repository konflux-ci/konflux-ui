import * as React from 'react';
import ChatbotAlert from '@patternfly/chatbot/dist/dynamic/ChatbotAlert';
import ChatbotContent from '@patternfly/chatbot/dist/dynamic/ChatbotContent';
import ChatbotWelcomePrompt from '@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt';
import Message from '@patternfly/chatbot/dist/dynamic/Message';
import MessageBox from '@patternfly/chatbot/dist/dynamic/MessageBox';
import { useInProgress, useMessages } from '@redhat-cloud-services/ai-react-state';
import { useChatMessageRehypePlugins } from '~/components/AIChat/chatMessagePlugins';
import {
  KONFLUX_AI_ERROR_TITLE,
  KONFLUX_AI_WELCOME_DESCRIPTION,
  KONFLUX_AI_WELCOME_TITLE,
} from '~/components/AIChat/const';
import { useAIChatInit } from '~/components/AIChat/hooks/useAIChatInit';
import { useAIChatSend } from '~/components/AIChat/hooks/useAIChatSend';
import { stateMessagesToMessageProps } from '~/components/AIChat/message-utils';
import { useScrollToBottom } from '~/shared/hooks/useScrollToBottom';

/**
 * Renders chat messages, welcome prompt, error alert, and auto-scrolls on updates.
 * Reads message/init/send state from AI providers — no props from the dock.
 */
export const AIChatMessageList: React.FC = () => {
  const stateMessages = useMessages();
  const isInProgress = useInProgress();
  const { initError, isInitializing } = useAIChatInit();
  const { sendError } = useAIChatSend();

  const messages = React.useMemo(
    () => stateMessagesToMessageProps(stateMessages, isInProgress),
    [isInProgress, stateMessages],
  );

  const announcement = React.useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return undefined;
    }
    if (lastMessage.isLoading) {
      return `${lastMessage.name} is responding.`;
    }
    return `Message from ${lastMessage.name}: ${lastMessage.content}`;
  }, [messages]);

  const scrollToBottomRef = useScrollToBottom(messages);
  const hasMessages = messages.length > 0;
  const rehypePlugins = useChatMessageRehypePlugins(hasMessages);
  const chatError = sendError ?? initError;

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
        {rehypePlugins
          ? messages.map((message, index) => (
              <React.Fragment key={message.id}>
                <Message {...message} additionalRehypePlugins={rehypePlugins} />
                {index === messages.length - 1 ? <div ref={scrollToBottomRef} /> : null}
              </React.Fragment>
            ))
          : null}
      </MessageBox>
    </ChatbotContent>
  );
};
