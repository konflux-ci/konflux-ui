import * as React from 'react';
import { Button, TextArea, TextAreResizeOrientation } from '@patternfly/react-core';
import { PaperPlaneIcon } from '@patternfly/react-icons/dist/esm/icons/paper-plane-icon';

type ChatInputProps = {
  onSend: (message: string) => void;
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [value, setValue] = React.useState('');

  const handleSend = React.useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setValue('');
  }, [onSend, value]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="konflux-ai-chat__input-bar" data-test="ai-chat-input-bar">
      <TextArea
        id="ai-chat-message-input"
        value={value}
        onChange={(_event, nextValue) => setValue(nextValue)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        aria-label="Message"
        className="konflux-ai-chat__input"
        data-test="ai-chat-message-input"
        resizeOrientation={TextAreResizeOrientation.vertical}
      />
      <Button
        variant="plain"
        className="konflux-ai-chat__send-btn"
        onClick={handleSend}
        aria-label="Send message"
        data-test="ai-chat-send-button"
        isDisabled={!value.trim()}
      >
        <PaperPlaneIcon />
      </Button>
    </div>
  );
};
