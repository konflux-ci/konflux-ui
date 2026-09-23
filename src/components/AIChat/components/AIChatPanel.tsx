import * as React from 'react';
import type { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import Chatbot from '@patternfly/chatbot/dist/dynamic/Chatbot';
import { KONFLUX_AI_DEFAULT_DISPLAY_MODE } from '~/components/AIChat/const';

type AIChatPanelProps = {
  isVisible: boolean;
  displayMode?: ChatbotDisplayMode;
  children: React.ReactNode;
};

/**
 * Presentational wrapper around PatternFly Chatbot that hosts header, content, and footer.
 */
export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isVisible,
  displayMode = KONFLUX_AI_DEFAULT_DISPLAY_MODE,
  children,
}) => (
  <Chatbot displayMode={displayMode} isVisible={isVisible}>
    {children}
  </Chatbot>
);
