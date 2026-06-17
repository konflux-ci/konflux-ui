import * as React from 'react';
import { ChevronDownIcon } from '@patternfly/react-icons/dist/esm/icons/chevron-down-icon';
import { ChevronUpIcon } from '@patternfly/react-icons/dist/esm/icons/chevron-up-icon';
import { ChatContextSelection } from '../context/types';
import { ChatContextChip } from './ChatContextChip';

type ChatContextChipsPanelProps = {
  selectedContexts: ChatContextSelection[];
  onRemove: (id: string) => void;
};

export const ChatContextChipsPanel: React.FC<ChatContextChipsPanelProps> = ({
  selectedContexts,
  onRemove,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  React.useEffect(() => {
    if (selectedContexts.length === 0) {
      setIsExpanded(true);
    }
  }, [selectedContexts.length]);

  if (selectedContexts.length === 0) {
    return null;
  }

  return (
    <div className="konflux-ai-chat__context-chips-panel">
      <button
        type="button"
        className="konflux-ai-chat__context-chips-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="ai-chat-context-chips"
        data-test="ai-chat-context-chips-toggle"
      >
        <span className="konflux-ai-chat__context-chips-toggle-label">
          Context ({selectedContexts.length})
        </span>
        {isExpanded ? (
          <ChevronUpIcon aria-hidden className="konflux-ai-chat__context-chips-toggle-icon" />
        ) : (
          <ChevronDownIcon aria-hidden className="konflux-ai-chat__context-chips-toggle-icon" />
        )}
      </button>
      {isExpanded ? (
        <div
          id="ai-chat-context-chips"
          className="konflux-ai-chat__context-chips"
          data-test="ai-chat-context-chips"
        >
          {selectedContexts.map((context) => (
            <ChatContextChip
              key={context.id}
              context={context}
              onClear={() => onRemove(context.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
