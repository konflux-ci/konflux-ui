import * as React from 'react';
import ChatbotToggle from '@patternfly/chatbot/dist/dynamic/ChatbotToggle';
import {
  KONFLUX_AI_TOGGLE_BUTTON_LABEL,
  KONFLUX_AI_TOGGLE_TOOLTIP,
} from '~/components/AIChat/const';

type AIChatToggleProps = {
  isVisible: boolean;
  onToggle: () => void;
};

/**
 * Floating action button that opens or closes the Konflux AI chat panel.
 */
export const AIChatToggle: React.FC<AIChatToggleProps> = ({ isVisible, onToggle }) => (
  <ChatbotToggle
    tooltipLabel={KONFLUX_AI_TOGGLE_TOOLTIP}
    toggleButtonLabel={KONFLUX_AI_TOGGLE_BUTTON_LABEL}
    isChatbotVisible={isVisible}
    onToggleChatbot={onToggle}
  />
);
