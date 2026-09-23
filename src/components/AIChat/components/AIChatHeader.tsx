import * as React from 'react';
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';
import KonfluxLogo from '~/assets/konflux-logo.svg';

type AIChatHeaderProps = {
  onClose: () => void;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
};

/**
 * Chat panel header with Konflux branding, an optional history menu, and a close action.
 */
export const AIChatHeader: React.FC<AIChatHeaderProps> = ({
  onClose,
  isDrawerOpen = false,
  onToggleDrawer,
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
      <ChatbotHeaderCloseButton onClick={onClose} />
    </ChatbotHeaderActions>
  </ChatbotHeader>
);
