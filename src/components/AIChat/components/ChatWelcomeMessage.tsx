import * as React from 'react';
import { ChatMessageBubble } from './ChatMessageBubble';

const WELCOME_CONTENT = `Hi there, I'm ready to help you with this app! 👋

😊 I'm your AI assistant. I've been trained to understand this application's features.`;

export const ChatWelcomeMessage: React.FC = () => (
  <ChatMessageBubble role="bot" content={WELCOME_CONTENT} />
);
