import * as React from 'react';
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';
import KonfluxLogo from '~/assets/konflux-logo.svg';
import { AIChatDisplayModeButton } from '~/components/AIChat/components/AIChatDisplayModeButton';

type AIChatDrawerHeaderProps = {
  isDrawerOpen: boolean;
  isMaximized: boolean;
  onClose: () => void;
  onToggleDrawer: () => void;
  onToggleDisplayMode: () => void;
};

export const AIChatDrawerHeader: React.FC<AIChatDrawerHeaderProps> = ({
  isDrawerOpen,
  isMaximized,
  onClose,
  onToggleDrawer,
  onToggleDisplayMode,
}) => (
  <ChatbotHeader>
    <ChatbotHeaderMain>
      <ChatbotHeaderMenu aria-expanded={isDrawerOpen} onMenuToggle={onToggleDrawer} />
      <ChatbotHeaderTitle>
        <KonfluxLogo aria-label="Konflux" className="ai-chat__brand" height={36} />
      </ChatbotHeaderTitle>
    </ChatbotHeaderMain>
    <ChatbotHeaderActions>
      <AIChatDisplayModeButton isMaximized={isMaximized} onToggle={onToggleDisplayMode} />
      <ChatbotHeaderCloseButton onClick={onClose} />
    </ChatbotHeaderActions>
  </ChatbotHeader>
);
