import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { AIChatMessageList } from '~/components/AIChat/components/AIChatMessageList';
import {
  KONFLUX_AI_ERROR_TITLE,
  KONFLUX_AI_WELCOME_DESCRIPTION,
  KONFLUX_AI_WELCOME_TITLE,
} from '~/components/AIChat/const';

const mockUseMessages = jest.fn();
const mockUseInProgress = jest.fn();
const mockUseChatMessageRehypePlugins = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useMessages: () => mockUseMessages(),
  useInProgress: () => mockUseInProgress(),
}));

jest.mock('~/components/AIChat/chatMessagePlugins', () => ({
  useChatMessageRehypePlugins: () => mockUseChatMessageRehypePlugins(),
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
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
    <div>
      <span>{name}</span>
      <span>{content}</span>
    </div>
  ),
}));

jest.mock('@patternfly/chatbot/dist/dynamic/MessageBox', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AIChatMessageList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMessages.mockReturnValue([]);
    mockUseInProgress.mockReturnValue(false);
    mockUseChatMessageRehypePlugins.mockReturnValue([[jest.fn()]]);
  });

  it('shows the welcome prompt when there are no messages and init is complete', () => {
    render(<AIChatMessageList isInitializing={false} />);

    expect(screen.getByTestId('chatbot-welcome')).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_WELCOME_TITLE)).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_WELCOME_DESCRIPTION)).toBeInTheDocument();
  });

  it('shows the supplied chat error in an inline alert', () => {
    render(<AIChatMessageList isInitializing={false} chatError="Send failed" />);

    expect(screen.getByTestId('chatbot-alert')).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_ERROR_TITLE)).toBeInTheDocument();
    expect(screen.getByText('Send failed')).toBeInTheDocument();
  });

  it('renders conversation messages and hides the welcome prompt', () => {
    mockUseMessages.mockReturnValue([
      {
        id: '1',
        role: 'user',
        answer: 'What is Konflux?',
        date: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: '2',
        role: 'bot',
        answer: 'Konflux is a CI/CD platform.',
        date: new Date('2026-01-01T00:00:01Z'),
      },
    ]);

    render(<AIChatMessageList isInitializing={false} />);

    expect(screen.queryByTestId('chatbot-welcome')).not.toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('What is Konflux?')).toBeInTheDocument();
    expect(screen.getByText('Konflux is a CI/CD platform.')).toBeInTheDocument();
  });

  it('does not show the welcome prompt while initializing with no messages', () => {
    render(<AIChatMessageList isInitializing />);

    expect(screen.queryByTestId('chatbot-welcome')).not.toBeInTheDocument();
  });
});
