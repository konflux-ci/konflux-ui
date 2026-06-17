import * as React from 'react';
import { useAIChat } from '../hooks/useAIChat';
import { ChatMessageBubble } from './ChatMessageBubble';

export const ChatMessages: React.FC = () => {
  const { messages } = useAIChat();

  return (
    <>
      {messages.map((message) => (
        <ChatMessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          contexts={message.contexts}
        />
      ))}
    </>
  );
};
