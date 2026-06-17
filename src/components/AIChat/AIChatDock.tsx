import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button } from '@patternfly/react-core';
import { CommentsIcon } from '@patternfly/react-icons/dist/esm/icons/comments-icon';
import { IfFeature } from '~/feature-flags/hooks';
import { AIChatPanel } from './components/AIChatPanel';
import { useAIChat } from './hooks/useAIChat';

import './AIChat.scss';

export const AIChatDock: React.FC = () => {
  const { isOpen, toggle } = useAIChat();

  const dock = (
    <div className="konflux-ai-chat konflux-ai-chat__dock" data-test="ai-chat-dock">
      {isOpen ? <AIChatPanel /> : null}
      {!isOpen ? (
        <Button
          variant="plain"
          onClick={toggle}
          aria-label="Open Konflux chat bot"
          aria-expanded={false}
          data-test="ai-chat-toggle"
          className="konflux-ai-chat__toggle-btn"
        >
          <CommentsIcon />
        </Button>
      ) : null}
    </div>
  );

  return <IfFeature flag="ai-chat">{ReactDOM.createPortal(dock, document.body)}</IfFeature>;
};
