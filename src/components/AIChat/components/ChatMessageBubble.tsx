import * as React from 'react';
import { ChatContextSelection } from '../context/types';
import { ChatContextChip } from './ChatContextChip';
import { KonfluxChatAvatar } from './KonfluxChatAvatar';

type ChatMessageBubbleProps = {
  role: 'user' | 'bot';
  content: string;
  contexts?: ChatContextSelection[];
};

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  role,
  content,
  contexts,
}) => (
  <div
    className={`konflux-ai-chat__message konflux-ai-chat__message--${role}`}
    data-test={`ai-chat-message-${role}`}
  >
    {role === 'bot' ? (
      <KonfluxChatAvatar
        className="konflux-ai-chat__message-avatar"
        iconClassName="konflux-ai-chat__message-avatar-icon"
      />
    ) : null}
    <div className="konflux-ai-chat__message-content">
      <div className="konflux-ai-chat__message-bubble">{content}</div>
      {contexts && contexts.length > 0 ? (
        <div className="konflux-ai-chat__message-contexts">
          {contexts.map((context) => (
            <ChatContextChip key={context.id} context={context} />
          ))}
        </div>
      ) : null}
    </div>
  </div>
);
