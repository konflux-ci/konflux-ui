import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { KonfluxChatAvatar } from './KonfluxChatAvatar';

type AIChatHeaderProps = {
  onClose: () => void;
};

export const AIChatHeader: React.FC<AIChatHeaderProps> = ({ onClose }) => (
  <header className="konflux-ai-chat__header" data-test="ai-chat-header">
    <Flex
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentSpaceBetween' }}
      flexWrap={{ default: 'nowrap' }}
    >
      <FlexItem className="konflux-ai-chat__header-brand">
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <KonfluxChatAvatar
              className="konflux-ai-chat__header-avatar"
              iconClassName="konflux-ai-chat__header-avatar-icon"
            />
          </FlexItem>
          <FlexItem>
            <h2 className="konflux-ai-chat__header-title">Konflux chat bot</h2>
          </FlexItem>
        </Flex>
      </FlexItem>
      <FlexItem>
        <Button
          variant="plain"
          className="konflux-ai-chat__close-btn"
          onClick={onClose}
          aria-label="Close chat"
          data-test="ai-chat-close"
        >
          <TimesIcon />
        </Button>
      </FlexItem>
    </Flex>
  </header>
);
