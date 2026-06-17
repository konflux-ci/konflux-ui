import * as React from 'react';
import { useAIChat } from '../hooks/useAIChat';
import { AIChatHeader } from './AIChatHeader';
import { ChatContextBar } from './ChatContextBar';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';
import { ChatWelcomeMessage } from './ChatWelcomeMessage';

export const AIChatPanel: React.FC = () => {
  const { close, sendMessage, messages, isPickingContext } = useAIChat();
  const messagesRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = messagesRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div
      className={`konflux-ai-chat__panel${isPickingContext ? ' konflux-ai-chat__panel--picking' : ''}`}
      data-test="ai-chat-panel"
      role="dialog"
      aria-label="Konflux chat bot"
    >
      <AIChatHeader onClose={close} />
      <div className="konflux-ai-chat__messages" ref={messagesRef} data-test="ai-chat-messages">
        {messages.length === 0 ? <ChatWelcomeMessage /> : null}
        <ChatMessages />
      </div>
      <ChatContextBar />
      <ChatInput onSend={sendMessage} />
    </div>
  );
};
