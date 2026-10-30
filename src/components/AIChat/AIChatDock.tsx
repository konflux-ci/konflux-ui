import * as React from 'react';
import { AIChatFooter } from '~/components/AIChat/components/AIChatFooter';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';
import { AIChatMessageList } from '~/components/AIChat/components/AIChatMessageList';
import { AIChatPanel } from '~/components/AIChat/components/AIChatPanel';
import { AIChatToggle } from '~/components/AIChat/components/AIChatToggle';
import { AIChatInitProvider, useAIChatInit } from '~/components/AIChat/hooks/useAIChatInit';
import { AIChatSendProvider, useAIChatSend } from '~/components/AIChat/hooks/useAIChatSend';
import { useAIChatVisibility } from '~/components/AIChat/hooks/useAIChatVisibility';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

const AIChatDockContent: React.FC = () => {
  const { initError, retryInit } = useAIChatInit();
  const { clearSendError } = useAIChatSend();

  const clearChatError = React.useCallback(() => {
    clearSendError();
    if (initError) {
      retryInit();
    }
  }, [clearSendError, initError, retryInit]);

  const { isVisible, toggle, hide } = useAIChatVisibility(clearChatError);

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
 * PatternFly chatbot dock. Init/send providers wrap children; message list and
 * footer read AI state hooks directly — no chat props from this shell.
 */
export const AIChatDock: React.FC = () => (
  <AIChatInitProvider>
    <AIChatSendProvider>
      <AIChatDockContent />
    </AIChatSendProvider>
  </AIChatInitProvider>
);
