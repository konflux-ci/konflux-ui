import * as React from 'react';
import ChatbotFooter, { ChatbotFootnote } from '@patternfly/chatbot/dist/dynamic/ChatbotFooter';
import MessageBar from '@patternfly/chatbot/dist/dynamic/MessageBar';
import {
  KONFLUX_AI_FOOTNOTE,
  KONFLUX_AI_MESSAGE_PLACEHOLDER,
} from '~/components/AIChat/const';

type AIChatFooterProps = {
  isSendDisabled: boolean;
  onSend: (message: string) => void;
};

/**
 * Message input bar and AI content footnote for the chat panel.
 */
export const AIChatFooter: React.FC<AIChatFooterProps> = ({ isSendDisabled, onSend }) => (
  <ChatbotFooter>
    <MessageBar
      hasAttachButton={false}
      isSendButtonDisabled={isSendDisabled}
      onSendMessage={(message) => {
        onSend(String(message));
      }}
      placeholder={KONFLUX_AI_MESSAGE_PLACEHOLDER}
    />
    <ChatbotFootnote label={KONFLUX_AI_FOOTNOTE} />
  </ChatbotFooter>
);
