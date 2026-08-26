import * as React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatDock } from '~/components/AIChat/AIChatDock';
import { KONFLUX_AI_INCLUDE_PAGE_CONTEXT_LABEL } from '~/components/AIChat/consts';
import { useLightspeedChat } from '~/components/AIChat/hooks/useLightspeedChat';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';

jest.mock('~/components/AIChat/hooks/useLightspeedChat', () => ({
  useLightspeedChat: jest.fn(),
}));

jest.mock('~/components/AIChat/chatMessagePlugins', () => ({
  CHAT_MESSAGE_REHYPE_PLUGINS: [],
}));

jest.mock('@patternfly/chatbot/dist/dynamic/Chatbot', () => {
  const ChatbotDisplayMode = { default: 'default' };
  const Chatbot = ({
    children,
    isVisible,
  }: {
    children?: React.ReactNode;
    isVisible?: boolean;
  }) => (isVisible ? <div>{children}</div> : null);
  return { __esModule: true, default: Chatbot, ChatbotDisplayMode };
});

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotToggle', () => ({
  __esModule: true,
  default: ({
    onToggleChatbot,
    toggleButtonLabel,
  }: {
    onToggleChatbot: () => void;
    toggleButtonLabel?: string;
  }) => (
    <button type="button" onClick={onToggleChatbot}>
      {toggleButtonLabel}
    </button>
  ),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotHeader', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    __esModule: true,
    default: passthrough,
    ChatbotHeaderActions: passthrough,
    ChatbotHeaderCloseButton: () => null,
    ChatbotHeaderMain: passthrough,
    ChatbotHeaderTitle: passthrough,
  };
});

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotContent', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotFooter', () => {
  const ChatbotFooter = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    __esModule: true,
    default: ChatbotFooter,
    ChatbotFootnote: () => null,
  };
});

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotAlert', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/Message', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@patternfly/chatbot/dist/dynamic/MessageBox', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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
        const input = event.currentTarget.elements.namedItem('message');
        if (input instanceof HTMLInputElement) {
          onSendMessage(input.value);
        }
      }}
    >
      <input name="message" placeholder={placeholder} aria-label="Message" />
      <button type="submit">Send</button>
    </form>
  ),
}));

const useLightspeedChatMock = jest.mocked(useLightspeedChat);

describe('AIChatDock', () => {
  const sendMessage = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    sendMessage.mockClear();
    useLightspeedChatMock.mockReturnValue({
      messages: [],
      announcement: undefined,
      isSendButtonDisabled: false,
      isInitializing: false,
      backendError: undefined,
      sendMessage,
    });
  });

  const openChat = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
    renderWithQueryClientAndRouter(<AIChatDock />);
    await user.click(screen.getByRole('button', { name: /open konflux ai assistant/i }));
  };

  it('should leave page context opt-in unchecked by default', async () => {
    const user = userEvent.setup();
    await openChat(user);

    expect(
      screen.getByRole('checkbox', { name: KONFLUX_AI_INCLUDE_PAGE_CONTEXT_LABEL }),
    ).not.toBeChecked();
  });

  it('should send without page context when the user does not opt in', async () => {
    const user = userEvent.setup();
    await openChat(user);

    await user.type(
      screen.getByPlaceholderText('Ask about your Konflux resources...'),
      'what failed?',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(sendMessage).toHaveBeenCalledWith('what failed?', { includePageContext: false });
  });

  it('should attach page context for one message and then reset the opt-in', async () => {
    const user = userEvent.setup();
    await openChat(user);

    const checkbox = screen.getByRole('checkbox', {
      name: KONFLUX_AI_INCLUDE_PAGE_CONTEXT_LABEL,
    });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.type(
      screen.getByPlaceholderText('Ask about your Konflux resources...'),
      'explain these logs',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(sendMessage).toHaveBeenCalledWith('explain these logs', {
      includePageContext: true,
    });
    expect(checkbox).not.toBeChecked();
  });
});
