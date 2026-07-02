import * as React from 'react';
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';
import { Brand } from '@patternfly/react-core';
import KonfluxLogo from '~/assets/konflux-logo.svg';

type AIChatDrawerHeaderProps = {
  isDrawerOpen: boolean;
  onClose: () => void;
  onToggleDrawer: () => void;
};

export const AIChatDrawerHeader: React.FC<AIChatDrawerHeaderProps> = ({
  isDrawerOpen,
  onClose,
  onToggleDrawer,
}) => (
  <ChatbotHeader>
    <ChatbotHeaderMain>
      <ChatbotHeaderMenu aria-expanded={isDrawerOpen} onMenuToggle={onToggleDrawer} />
      <ChatbotHeaderTitle>
        <Brand alt="" className="konflux-ai-chat__brand" heights={{ default: '36px' }}>
          <KonfluxLogo aria-label="Konflux" />
        </Brand>
      </ChatbotHeaderTitle>
    </ChatbotHeaderMain>
    <ChatbotHeaderActions>
      <ChatbotHeaderCloseButton onClick={onClose} />
    </ChatbotHeaderActions>
  </ChatbotHeader>
);
