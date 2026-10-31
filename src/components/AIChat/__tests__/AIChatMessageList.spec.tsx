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
});
