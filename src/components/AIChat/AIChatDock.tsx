import * as React from 'react';
import { AIStateProvider, useInProgress } from '@redhat-cloud-services/ai-react-state';
import { AIChatFooter } from '~/components/AIChat/components/AIChatFooter';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';
import { AIChatMessageList } from '~/components/AIChat/components/AIChatMessageList';
import { AIChatPanel } from '~/components/AIChat/components/AIChatPanel';
import { AIChatToggle } from '~/components/AIChat/components/AIChatToggle';
import { useAIChatInit } from '~/components/AIChat/hooks/useAIChatInit';
import { useAIChatSend } from '~/components/AIChat/hooks/useAIChatSend';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';
import { useToggle } from '~/shared/hooks/useToggle';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

const AIChatDockContent: React.FC = () => {
  const [isVisible, toggle] = useToggle();
  const { initError, isInitializing, retryInit } = useAIChatInit();
  const { sendError, clearSendError, sendMessage } = useAIChatSend();
  const isInProgress = useInProgress();

  const handleToggle = React.useCallback(() => {
    if (!isVisible) {
      clearSendError();
      if (initError) {
        retryInit();
      }
    }
    toggle();
  }, [clearSendError, initError, isVisible, retryInit, toggle]);

  const chatError = sendError ?? initError;
  const isSendDisabled = isInProgress || !!chatError || isInitializing;

  return (
    <div className="ai-chat" data-test="ai-chat-dock">
      <AIChatToggle isVisible={isVisible} onToggle={handleToggle} />
      <AIChatPanel isVisible={isVisible}>
        <AIChatHeader onClose={toggle} />
        <AIChatMessageList isInitializing={isInitializing} chatError={chatError} />
        <AIChatFooter
          isSendDisabled={isSendDisabled}
          onSend={(message) => {
            void sendMessage(message);
          }}
        />
      </AIChatPanel>
    </div>
  );
};

/** PatternFly chatbot dock backed by the Red Hat AI state provider. */
const AIChatDock: React.FC = () => (
  <AIStateProvider client={getLightspeedClient()}>
    <AIChatDockContent />
  </AIStateProvider>
);

export default AIChatDock;
