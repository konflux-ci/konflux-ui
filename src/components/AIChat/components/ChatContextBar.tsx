import * as React from 'react';
import { ChatContextSelector } from './ChatContextSelector';

export const ChatContextBar: React.FC = () => (
  <div className="konflux-ai-chat__context-bar" data-test="ai-chat-context-bar">
    <ChatContextSelector />
  </div>
);
