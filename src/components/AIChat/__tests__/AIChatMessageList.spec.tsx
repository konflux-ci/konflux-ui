import * as React from 'react';
import { render, screen } from '@testing-library/react';
import type { Message } from '@redhat-cloud-services/ai-client-state';
import { AIChatMessageList } from '~/components/AIChat/components/AIChatMessageList';
import {
  KONFLUX_AI_ERROR_TITLE,
  KONFLUX_AI_WELCOME_DESCRIPTION,
  KONFLUX_AI_WELCOME_TITLE,
} from '~/components/AIChat/const';

const mockUseMessages = jest.fn();
const mockUseInProgress = jest.fn();
const mockUseAIChatInit = jest.fn();
const mockUseAIChatSend = jest.fn();
const mockUseChatMessageRehypePlugins = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useMessages: () => mockUseMessages(),
  useInProgress: () => mockUseInProgress(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatInit', () => ({
  useAIChatInit: () => mockUseAIChatInit(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatSend', () => ({
  useAIChatSend: () => mockUseAIChatSend(),
}));

jest.mock('~/components/AIChat/chatMessagePlugins', () => ({
  useChatMessageRehypePlugins: (enabled: boolean) => mockUseChatMessageRehypePlugins(enabled),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotAlert', () => ({
  __esModule: true,
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-test="chatbot-alert">
      <span>{title}</span>
      <div>{children}</div>
    </div>
  ),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotContent', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-test="chatbot-content">{children}</div>
  ),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt', () => ({
  __esModule: true,
  default: ({ title, description }: { title: string; description: string }) => (
    <div data-test="chatbot-welcome">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/Message', () => ({
  __esModule: true,
  default: ({ content, name }: { content: string; name: string }) => (
    <div data-test="chat-message">
      <span>{name}</span>
      <span>{content}</span>
    </div>
  ),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/MessageBox', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-test="message-box">{children}</div>
  ),
}));

const createMessage = (overrides: Partial<Message> & Pick<Message, 'id' | 'role'>): Message => ({
  answer: '',
  date: new Date('2026-01-15T12:00:00.000Z'),
  ...overrides,
});

describe('AIChatMessageList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMessages.mockReturnValue([]);
    mockUseInProgress.mockReturnValue(false);
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: false,
      retryInit: jest.fn(),
    });
    mockUseAIChatSend.mockReturnValue({
      sendError: undefined,
      clearSendError: jest.fn(),
      sendMessage: jest.fn(),
    });
    mockUseChatMessageRehypePlugins.mockReturnValue([[jest.fn()]]);
  });

  it('shows the welcome prompt when there are no messages and init is complete', () => {
    render(<AIChatMessageList />);

    expect(screen.getByTestId('chatbot-welcome')).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_WELCOME_TITLE)).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_WELCOME_DESCRIPTION)).toBeInTheDocument();
  });

  it('hides the welcome prompt while initializing', () => {
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: true,
      retryInit: jest.fn(),
    });

    render(<AIChatMessageList />);

    expect(screen.queryByTestId('chatbot-welcome')).not.toBeInTheDocument();
  });

  it('renders messages only after rehype plugins are loaded', () => {
    mockUseMessages.mockReturnValue([
      createMessage({ id: 'u1', role: 'user', answer: 'Hello' }),
    ]);
    mockUseChatMessageRehypePlugins.mockReturnValue(undefined);

    const { rerender } = render(<AIChatMessageList />);

    expect(screen.queryByTestId('chat-message')).not.toBeInTheDocument();
    expect(mockUseChatMessageRehypePlugins).toHaveBeenCalledWith(true);

    mockUseChatMessageRehypePlugins.mockReturnValue([[jest.fn()]]);
    rerender(<AIChatMessageList />);

    expect(screen.getByTestId('chat-message')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows send errors in an inline alert', () => {
    mockUseAIChatSend.mockReturnValue({
      sendError: 'Send failed',
      clearSendError: jest.fn(),
      sendMessage: jest.fn(),
    });

    render(<AIChatMessageList />);

    expect(screen.getByTestId('chatbot-alert')).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_ERROR_TITLE)).toBeInTheDocument();
    expect(screen.getByText('Send failed')).toBeInTheDocument();
  });

  it('prefers send errors over init errors when both are present', () => {
    mockUseAIChatInit.mockReturnValue({
      initError: 'Init failed',
      isInitializing: false,
      retryInit: jest.fn(),
    });
    mockUseAIChatSend.mockReturnValue({
      sendError: 'Send failed',
      clearSendError: jest.fn(),
      sendMessage: jest.fn(),
    });

    render(<AIChatMessageList />);

    expect(screen.getByText('Send failed')).toBeInTheDocument();
    expect(screen.queryByText('Init failed')).not.toBeInTheDocument();
  });
});
