import * as React from 'react';
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';
import konfluxLogo from '~/assets/iconsUrl/konflux.svg';

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
        <img src={konfluxLogo} alt="Konflux" className="konflux-ai-chat__brand" />
      </ChatbotHeaderTitle>
    </ChatbotHeaderMain>
    <ChatbotHeaderActions>
      <ChatbotHeaderCloseButton onClick={onClose} />
    </ChatbotHeaderActions>
  </ChatbotHeader>
);
