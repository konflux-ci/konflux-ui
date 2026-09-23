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

type AIChatHeaderProps = {
  onClose: () => void;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
  isMaximized?: boolean;
  onToggleDisplayMode?: () => void;
};

/**
 * Chat panel header with Konflux branding, history, display mode, and close.
 */
export const AIChatHeader: React.FC<AIChatHeaderProps> = ({
  onClose,
  isDrawerOpen = false,
  onToggleDrawer,
  isMaximized = false,
  onToggleDisplayMode,
}) => (
  <ChatbotHeader>
    <ChatbotHeaderMain>
      {onToggleDrawer ? (
        <ChatbotHeaderMenu aria-expanded={isDrawerOpen} onMenuToggle={onToggleDrawer} />
      ) : null}
      <ChatbotHeaderTitle>
        <KonfluxLogo aria-label="Konflux" className="ai-chat__brand" height={36} />
      </ChatbotHeaderTitle>
    </ChatbotHeaderMain>
    <ChatbotHeaderActions>
      {onToggleDisplayMode ? (
        <AIChatDisplayModeButton isMaximized={isMaximized} onToggle={onToggleDisplayMode} />
      ) : null}
      <ChatbotHeaderCloseButton onClick={onClose} />
    </ChatbotHeaderActions>
  </ChatbotHeader>
);
