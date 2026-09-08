import * as React from 'react';
import ChatbotFooter, { ChatbotFootnote } from '@patternfly/chatbot/dist/dynamic/ChatbotFooter';
import MessageBar from '@patternfly/chatbot/dist/dynamic/MessageBar';
import { KONFLUX_AI_FOOTNOTE, KONFLUX_AI_MESSAGE_PLACEHOLDER } from '~/components/AIChat/consts';

type AIChatDrawerFooterProps = {
  isSendButtonDisabled: boolean;
  onSendMessage: (message: string | number) => void;
};

export const AIChatDrawerFooter: React.FC<AIChatDrawerFooterProps> = ({
  isSendButtonDisabled,
  onSendMessage,
}) => (
  <ChatbotFooter>
    <MessageBar
      onSendMessage={onSendMessage}
      isSendButtonDisabled={isSendButtonDisabled}
      hasAttachButton={false}
      placeholder={KONFLUX_AI_MESSAGE_PLACEHOLDER}
    />
    <ChatbotFootnote label={KONFLUX_AI_FOOTNOTE} />
  </ChatbotFooter>
);
