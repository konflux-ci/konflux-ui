import * as React from 'react';
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';
import KonfluxLogo from '~/assets/konflux-logo.svg';

type AIChatHeaderProps = {
  onClose: () => void;
};

/**
 * Chat panel header with Konflux branding and a close action.
 */
export const AIChatHeader: React.FC<AIChatHeaderProps> = ({ onClose }) => (
  <ChatbotHeader>
    <ChatbotHeaderMain>
      <ChatbotHeaderTitle>
        <KonfluxLogo aria-label="Konflux" className="ai-chat__brand" height={36} />
      </ChatbotHeaderTitle>
    </ChatbotHeaderMain>
    <ChatbotHeaderActions>
      <ChatbotHeaderCloseButton onClick={onClose} />
    </ChatbotHeaderActions>
  </ChatbotHeader>
);
