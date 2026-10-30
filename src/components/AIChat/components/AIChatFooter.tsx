import * as React from 'react';
import ChatbotFooter, { ChatbotFootnote } from '@patternfly/chatbot/dist/dynamic/ChatbotFooter';
import MessageBar from '@patternfly/chatbot/dist/dynamic/MessageBar';
import { useInProgress } from '@redhat-cloud-services/ai-react-state';
import {
  KONFLUX_AI_FOOTNOTE,
  KONFLUX_AI_MESSAGE_PLACEHOLDER,
} from '~/components/AIChat/const';
import { useAIChatInit } from '~/components/AIChat/hooks/useAIChatInit';
import { useAIChatSend } from '~/components/AIChat/hooks/useAIChatSend';

/**
 * Message input bar and AI content footnote. Derives send-disabled from chat hooks.
 */
export const AIChatFooter: React.FC = () => {
  const isInProgress = useInProgress();
  const { initError, isInitializing } = useAIChatInit();
  const { sendError, sendMessage } = useAIChatSend();

  const isSendDisabled = isInProgress || !!sendError || !!initError || isInitializing;

  return (
    <ChatbotFooter>
      <MessageBar
        hasAttachButton={false}
        isSendButtonDisabled={isSendDisabled}
        onSendMessage={(message) => {
          void sendMessage(String(message));
        }}
        placeholder={KONFLUX_AI_MESSAGE_PLACEHOLDER}
      />
      <ChatbotFootnote label={KONFLUX_AI_FOOTNOTE} />
    </ChatbotFooter>
  );
};
