import * as React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AIChatDock } from '~/components/AIChat/AIChatDock';
import { useLightspeedChat } from '~/lightspeed/useLightspeedChat';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';

jest.mock('@patternfly/chatbot/dist/dynamic/Chatbot', () => ({
  __esModule: true,
  ChatbotDisplayMode: { default: 'default' },
  default: ({ children, isVisible }: { children: React.ReactNode; isVisible?: boolean }) =>
    isVisible ? <div>{children}</div> : null,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotAlert', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotContent', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotFooter', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotFootnote: () => null,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotHeader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotHeaderActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotHeaderCloseButton: () => null,
  ChatbotHeaderMain: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotHeaderTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotToggle', () => ({
  __esModule: true,
  default: ({
    onToggleChatbot,
    toggleButtonLabel,
  }: {
    onToggleChatbot: () => void;
    toggleButtonLabel: string;
  }) => (
    <button type="button" onClick={onToggleChatbot}>
      {toggleButtonLabel}
    </button>
  ),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/Message', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/MessageBar', () => ({
  __esModule: true,
  default: ({
    onSendMessage,
    placeholder,
  }: {
    onSendMessage: (message: string) => void;
    placeholder?: string;
  }) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        onSendMessage(String(data.get('message') ?? ''));
        form.reset();
      }}
    >
      <input aria-label={placeholder} name="message" />
      <button type="submit">Send</button>
    </form>
  ),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/MessageBox', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('~/components/AIChat/chatMessagePlugins', () => ({
  CHAT_MESSAGE_REHYPE_PLUGINS: [],
}));

jest.mock('~/lightspeed/useLightspeedChat', () => ({
  useLightspeedChat: jest.fn(),
}));

const useLightspeedChatMock = useLightspeedChat as jest.Mock;

const sendMessage = jest.fn();

describe('AIChatDock context checkbox', () => {
  beforeEach(() => {
    sendMessage.mockReset();
    useLightspeedChatMock.mockReturnValue({
      messages: [],
      isSendButtonDisabled: false,
      isInitializing: false,
      clearChatError: jest.fn(),
      sendMessage,
    });
  });

  it('should send without page context until the checkbox is checked', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<AIChatDock />);

    await user.click(screen.getByRole('button', { name: 'Open Konflux AI assistant' }));

    const checkbox = screen.getByRole('checkbox', { name: 'Send context as attachment' });
    expect(checkbox).not.toBeChecked();

    await user.type(
      screen.getByRole('textbox', { name: 'Ask about your Konflux resources...' }),
      'Hello',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(sendMessage).toHaveBeenCalledWith('Hello', { includePageContext: false });

    await user.click(checkbox);
    const textbox = screen.getByRole('textbox', { name: 'Ask about your Konflux resources...' });
    await user.clear(textbox);
    await user.type(textbox, 'Again');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(sendMessage).toHaveBeenLastCalledWith('Again', { includePageContext: true });
  });
});
