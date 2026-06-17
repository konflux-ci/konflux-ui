import * as React from 'react';
import { ChatContextSelection } from '../context/types';

type ChatContextChipProps = {
  context: ChatContextSelection;
  onClear?: () => void;
  compact?: boolean;
};

export const ChatContextChip: React.FC<ChatContextChipProps> = ({
  context,
  onClear,
  compact = false,
}) => (
  <span
    className={`konflux-ai-chat__context-chip${compact ? ' konflux-ai-chat__context-chip--compact' : ''}`}
    data-test="ai-chat-context-chip"
    title={context.description ?? context.label}
  >
    <span className="konflux-ai-chat__context-chip-label">{context.label}</span>
    {onClear ? (
      <button
        type="button"
        className="konflux-ai-chat__context-chip-clear"
        onClick={onClear}
        aria-label={`Clear context: ${context.label}`}
        data-test="ai-chat-context-chip-clear"
      >
        ×
      </button>
    ) : null}
  </span>
);
