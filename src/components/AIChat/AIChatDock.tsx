import * as React from 'react';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { AIChatFooter } from '~/components/AIChat/components/AIChatFooter';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';
import { AIChatMessageList } from '~/components/AIChat/components/AIChatMessageList';
import { AIChatPanel } from '~/components/AIChat/components/AIChatPanel';
import { AIChatToggle } from '~/components/AIChat/components/AIChatToggle';
import { AIChatInitProvider, useAIChatInit } from '~/components/AIChat/hooks/useAIChatInit';
import { AIChatSendProvider, useAIChatSend } from '~/components/AIChat/hooks/useAIChatSend';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

const AIChatDockContent: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const { initError, retryInit } = useAIChatInit();
  const { clearSendError } = useAIChatSend();

  const clearChatError = () => {
    clearSendError();
    if (initError) {
      retryInit();
    }
  };

  const hide = () => {
    setIsVisible(false);
    clearChatError();
  };

  const toggle = () => {
    if (isVisible) {
      clearChatError();
    }
    setIsVisible(!isVisible);
  };

  return (
    <div className="ai-chat" data-test="ai-chat-dock">
      <AIChatToggle isVisible={isVisible} onToggle={toggle} />
      <AIChatPanel isVisible={isVisible}>
        <AIChatHeader onClose={hide} />
        <AIChatMessageList />
        <AIChatFooter />
      </AIChatPanel>
    </div>
  );
};

/**
 * PatternFly chatbot dock. Lazy-loaded from {@link AIChatGate} so Lightspeed /
 * ai-react-state stay out of the main bundle. Init/send providers wrap children;
 * message list and footer read AI state hooks directly.
 */
export const AIChatDock: React.FC = () => (
  <AIStateProvider client={getLightspeedClient()}>
    <AIChatInitProvider>
      <AIChatSendProvider>
        <AIChatDockContent />
      </AIChatSendProvider>
    </AIChatInitProvider>
  </AIStateProvider>
);

export default AIChatDock;
