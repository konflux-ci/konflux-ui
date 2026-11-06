import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatFooter } from '~/components/AIChat/components/AIChatFooter';
import {
  KONFLUX_AI_FOOTNOTE,
  KONFLUX_AI_MESSAGE_PLACEHOLDER,
} from '~/components/AIChat/const';

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotFooter', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotFootnote: ({ label }: { label: string }) => <p>{label}</p>,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/MessageBar', () => ({
  __esModule: true,
  default: ({
    isSendButtonDisabled,
    onSendMessage,
    placeholder,
  }: {
    isSendButtonDisabled: boolean;
    onSendMessage: (message: string | number) => void;
    placeholder: string;
  }) => (
    <div>
      <input aria-label="chat-message" placeholder={placeholder} />
      <button
        type="button"
        disabled={isSendButtonDisabled}
        onClick={() => onSendMessage('hello from chat')}
      >
        Send
      </button>
    </div>
  ),
}));

describe('AIChatFooter', () => {
  it('renders the placeholder and footnote', () => {
    render(<AIChatFooter isSendDisabled={false} onSend={jest.fn()} />);

    expect(screen.getByPlaceholderText(KONFLUX_AI_MESSAGE_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_FOOTNOTE)).toBeInTheDocument();
  });

  it('disables send when requested and forwards messages to onSend', async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();

    const { rerender } = render(<AIChatFooter isSendDisabled onSend={onSend} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    rerender(<AIChatFooter isSendDisabled={false} onSend={onSend} />);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledWith('hello from chat');
  });
});
