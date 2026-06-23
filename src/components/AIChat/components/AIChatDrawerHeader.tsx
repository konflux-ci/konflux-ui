import * as React from 'react';
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
} from '@patternfly/chatbot/dist/dynamic/ChatbotHeader';
import konfluxLogoLight from '~/assets/iconsUrl/konflux-light.svg';
import konfluxLogo from '~/assets/iconsUrl/konflux.svg';
import { THEME_DARK, useTheme } from '~/shared/theme';

type AIChatDrawerHeaderProps = {
  isDrawerOpen: boolean;
  onClose: () => void;
  onToggleDrawer: () => void;
};

export const AIChatDrawerHeader: React.FC<AIChatDrawerHeaderProps> = ({
  isDrawerOpen,
  onClose,
  onToggleDrawer,
}) => {
  const { effectiveTheme } = useTheme();
  const logoSrc = effectiveTheme === THEME_DARK ? konfluxLogo : konfluxLogoLight;

  return (
    <ChatbotHeader>
      <ChatbotHeaderMain>
        <ChatbotHeaderMenu aria-expanded={isDrawerOpen} onMenuToggle={onToggleDrawer} />
        <ChatbotHeaderTitle>
          <img src={logoSrc} alt="Konflux" className="konflux-ai-chat__brand" />
        </ChatbotHeaderTitle>
      </ChatbotHeaderMain>
      <ChatbotHeaderActions>
        <ChatbotHeaderCloseButton onClick={onClose} />
      </ChatbotHeaderActions>
    </ChatbotHeader>
  );
};
