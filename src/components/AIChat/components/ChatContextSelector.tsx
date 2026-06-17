import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { getPageContextId } from '../context/page-context';
import { useAIChat } from '../hooks/useAIChat';
import { ChatContextChipsPanel } from './ChatContextChipsPanel';

export const ChatContextSelector: React.FC = () => {
  const { pathname } = useLocation();
  const {
    selectedContexts,
    isPickingContext,
    startContextPick,
    finishContextPick,
    cancelContextPick,
    removeContext,
    clearContext,
    toggleCurrentPageContext,
  } = useAIChat();

  const pageContextId = getPageContextId(pathname);
  const isCurrentPageSelected = selectedContexts.some((context) => context.id === pageContextId);
  const hasSelections = selectedContexts.length > 0;

  if (isPickingContext) {
    return (
      <div className="konflux-ai-chat__context-selector" data-test="ai-chat-context-picking-controls">
        <ChatContextChipsPanel selectedContexts={selectedContexts} onRemove={removeContext} />
        <div className="konflux-ai-chat__context-actions">
          <button
            type="button"
            className="konflux-ai-chat__context-action-btn konflux-ai-chat__context-action-btn--primary"
            onClick={finishContextPick}
            data-test="ai-chat-context-pick-done"
            aria-label="Finish context selection"
          >
            Done
          </button>
          <button
            type="button"
            className="konflux-ai-chat__context-action-btn konflux-ai-chat__context-action-btn--secondary"
            onClick={cancelContextPick}
            data-test="ai-chat-context-pick-cancel"
            aria-label="Cancel context selection"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="konflux-ai-chat__context-selector">
      <ChatContextChipsPanel selectedContexts={selectedContexts} onRemove={removeContext} />
      <div className="konflux-ai-chat__context-actions">
        <button
          type="button"
          className="konflux-ai-chat__context-action-btn konflux-ai-chat__context-action-btn--primary"
          onClick={startContextPick}
          data-test="ai-chat-context-pick"
          aria-label="Pick page context"
          title="Select components from the page"
        >
          Pick context
        </button>
        <button
          type="button"
          className={`konflux-ai-chat__context-action-btn konflux-ai-chat__context-action-btn--page${
            isCurrentPageSelected ? ' konflux-ai-chat__context-action-btn--active' : ''
          }`}
          onClick={toggleCurrentPageContext}
          data-test="ai-chat-context-page"
          aria-label="Toggle current page context"
          aria-pressed={isCurrentPageSelected}
          title="Include the entire current page"
        >
          This page
        </button>
        <button
          type="button"
          className="konflux-ai-chat__context-action-btn konflux-ai-chat__context-action-btn--secondary"
          onClick={clearContext}
          data-test="ai-chat-context-clear"
          aria-label="Clear all context"
          disabled={!hasSelections}
        >
          Clear
        </button>
      </div>
    </div>
  );
};
