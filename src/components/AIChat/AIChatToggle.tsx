import * as React from 'react';
import { Button, ToolbarItem, Tooltip } from '@patternfly/react-core';
import { CommentsIcon } from '@patternfly/react-icons/dist/esm/icons/comments-icon';
import { IfFeature } from '~/feature-flags/hooks';
import { useAIChat } from './hooks/useAIChat';

export const AIChatToggle: React.FC = () => {
  const { isOpen, toggle } = useAIChat();

  return (
    <IfFeature flag="ai-chat">
      <ToolbarItem>
        <Tooltip content="Konflux chat bot">
          <Button
            variant={isOpen ? 'primary' : 'plain'}
            onClick={toggle}
            aria-label="Konflux chat bot"
            aria-expanded={isOpen}
            data-test="ai-chat-header-toggle"
          >
            <CommentsIcon />
          </Button>
        </Tooltip>
      </ToolbarItem>
    </IfFeature>
  );
};
