import * as React from 'react';
import { AIChatFooter } from '~/components/AIChat/components/AIChatFooter';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';
import { AIChatMessageList } from '~/components/AIChat/components/AIChatMessageList';
import { AIChatPanel } from '~/components/AIChat/components/AIChatPanel';
import { AIChatToggle } from '~/components/AIChat/components/AIChatToggle';
import { useAIChatVisibility } from '~/components/AIChat/hooks/useAIChatVisibility';
import { useLightspeedChat } from '~/lightspeed/useLightspeedChat';

import '@patternfly/chatbot/dist/css/main.css';
import './AIChat.scss';

/**
 * PatternFly chatbot dock with Lightspeed SSE send/receive.
 */
export const AIChatDock: React.FC = () => {
  const {
    messages,
    announcement,
    isInProgress,
    isInitializing,
    chatError,
    clearChatError,
    sendMessage,
  } = useLightspeedChat();
  const { isVisible, toggle, hide } = useAIChatVisibility(clearChatError);

  const isSendDisabled = isInProgress || !!chatError || isInitializing;

  return (
    <div className="ai-chat" data-test="ai-chat-dock">
      <AIChatToggle isVisible={isVisible} onToggle={toggle} />
      <AIChatPanel isVisible={isVisible}>
        <AIChatHeader onClose={hide} />
        <AIChatMessageList
          messages={messages}
          announcement={announcement}
          isInitializing={isInitializing}
          chatError={chatError}
        />
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
