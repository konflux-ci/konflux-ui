import * as React from 'react';
import Chatbot from '@patternfly/chatbot/dist/dynamic/Chatbot';
import { KONFLUX_AI_DISPLAY_MODE } from '~/components/AIChat/const';

type AIChatPanelProps = {
  isVisible: boolean;
  children: React.ReactNode;
};

/**
 * Presentational wrapper around PatternFly Chatbot that hosts header, content, and footer.
 */
export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isVisible, children }) => (
  <Chatbot displayMode={KONFLUX_AI_DISPLAY_MODE} isVisible={isVisible}>
    {children}
  </Chatbot>
);
