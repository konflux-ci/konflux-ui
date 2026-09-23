import * as React from 'react';
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';
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
        <KonfluxLogo aria-label="Konflux" className="ai-chat__brand" height={36} />
      </ChatbotHeaderTitle>
    </ChatbotHeaderMain>
    <ChatbotHeaderActions>
      <ChatbotHeaderCloseButton onClick={onClose} />
    </ChatbotHeaderActions>
  </ChatbotHeader>
);
