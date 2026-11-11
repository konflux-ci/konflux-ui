import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChatDock from '~/components/AIChat/AIChatDock';
import { KONFLUX_AI_ERROR_UNAVAILABLE } from '~/components/AIChat/const';

const mockUseAIChatInit = jest.fn();
const mockUseAIChatSend = jest.fn();
const mockUseInProgress = jest.fn();
const mockAIChatFooter = jest.fn();
const mockRefreshConversations = jest.fn();
const mockUseAIChatConversations = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  AIStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useInProgress: () => mockUseInProgress(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatInit', () => ({
  useAIChatInit: () => mockUseAIChatInit(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatSend', () => ({
  useAIChatSend: () => mockUseAIChatSend(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatConversations', () => ({
  useAIChatConversations: () => mockUseAIChatConversations(),
}));

jest.mock('~/components/AIChat/components/AIChatDeleteConversationModal', () => ({
  AIChatDeleteConversationModal: ({
    errorMessage,
    isOpen,
  }: {
    errorMessage?: string;
    isOpen: boolean;
  }) => (isOpen && errorMessage ? <p>{errorMessage}</p> : null),
}));

jest.mock('~/components/AIChat/components/AIChatRenameConversationModal', () => ({
  AIChatRenameConversationModal: ({
    errorMessage,
    isOpen,
  }: {
    errorMessage?: string;
    isOpen: boolean;
  }) => (isOpen && errorMessage ? <p>{errorMessage}</p> : null),
}));

jest.mock('~/components/AIChat/components/AIChatHistoryNav', () => ({
  AIChatHistoryNav: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('~/components/AIChat/components/AIChatToggle', () => ({
  AIChatToggle: ({ onToggle }: { onToggle: () => void }) => (
    <button type="button" onClick={onToggle}>
      Toggle chat
    </button>
  ),
}));

jest.mock('~/components/AIChat/components/AIChatPanel', () => ({
  AIChatPanel: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('~/components/AIChat/components/AIChatHeader', () => ({
  AIChatHeader: () => null,
}));

jest.mock('~/components/AIChat/components/AIChatMessageList', () => ({
  AIChatMessageList: ({ chatError }: { chatError?: string }) =>
    chatError ? <p>{chatError}</p> : null,
}));

jest.mock('~/components/AIChat/components/AIChatFooter', () => ({
  AIChatFooter: (props: unknown) => {
    mockAIChatFooter(props);
    return null;
  },
}));

describe('AIChatDock', () => {
  const clearSendError = jest.fn();
  const retryInit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInProgress.mockReturnValue(false);
    mockUseAIChatConversations.mockReturnValue({
      activeConversationId: null,
      conversations: [],
      conversationError: undefined,
      hasNoSearchResults: false,
      deleteConversationTarget: null,
      isDeletingConversation: false,
      isLoadingConversations: false,
      isRenamingConversation: false,
      renameConversationTarget: null,
      closeDeleteConversation: jest.fn(),
      confirmDeleteConversation: jest.fn(),
      clearConversationError: jest.fn(),
      closeRenameConversation: jest.fn(),
      confirmRenameConversation: jest.fn(),
      refreshConversations: mockRefreshConversations,
      startNewChat: jest.fn(),
      selectConversation: jest.fn(),
      filterConversations: jest.fn(),
    });
    mockUseAIChatSend.mockReturnValue({
      sendError: undefined,
      clearSendError,
      sendMessage: jest.fn(),
    });
  });

  it('renders the toggle inside the AI Chat landmark', () => {
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: false,
      retryInit,
    });

    render(<AIChatDock />);

    const landmark = screen.getByRole('complementary', { name: 'AI Chat' });

    expect(landmark.parentElement).toBe(document.body);
    expect(landmark).toContainElement(screen.getByRole('button', { name: 'Toggle chat' }));
  });

  it('does not retry initialization when opening a healthy chat panel', async () => {
    const user = userEvent.setup();
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: false,
      retryInit,
    });

    render(<AIChatDock />);
    await user.click(screen.getByRole('button', { name: 'Toggle chat' }));

    expect(clearSendError).toHaveBeenCalledTimes(1);
    expect(retryInit).not.toHaveBeenCalled();
  });

  it('retries initialization when opening after an initialization error', async () => {
    const user = userEvent.setup();
    mockUseAIChatInit.mockReturnValue({
      initError: 'Initialization failed',
      isInitializing: false,
      retryInit,
    });

    render(<AIChatDock />);
    await user.click(screen.getByRole('button', { name: 'Toggle chat' }));

    expect(retryInit).toHaveBeenCalledTimes(1);
  });

  it('allows sending after a send error when initialization is healthy', () => {
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: false,
      retryInit,
    });
    mockUseAIChatSend.mockReturnValue({
      sendError: 'Sending failed',
      clearSendError,
      sendMessage: jest.fn(),
    });

    render(<AIChatDock />);

    expect(mockAIChatFooter).toHaveBeenLastCalledWith(
      expect.objectContaining({ isSendDisabled: false }),
    );
  });

  it('refreshes conversation history after a message is sent', async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: false,
      retryInit,
    });
    mockUseAIChatSend.mockReturnValue({
      sendError: undefined,
      clearSendError,
      sendMessage,
    });

    render(<AIChatDock />);

    const { onSend } = mockAIChatFooter.mock.lastCall?.[0] as {
      onSend: (message: string) => Promise<void>;
    };

    await act(async () => {
      await onSend('hello');
    });

    expect(sendMessage).toHaveBeenCalledWith('hello');
    expect(mockRefreshConversations).toHaveBeenCalledTimes(1);
  });

  it('shows a conversation error in the chat panel', () => {
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: false,
      retryInit,
    });
    mockUseAIChatConversations.mockReturnValue({
      activeConversationId: null,
      conversations: [],
      conversationError: KONFLUX_AI_ERROR_UNAVAILABLE,
      hasNoSearchResults: false,
      deleteConversationTarget: null,
      isDeletingConversation: false,
      isLoadingConversations: false,
      isRenamingConversation: false,
      renameConversationTarget: null,
      closeDeleteConversation: jest.fn(),
      confirmDeleteConversation: jest.fn(),
      clearConversationError: jest.fn(),
      closeRenameConversation: jest.fn(),
      confirmRenameConversation: jest.fn(),
      refreshConversations: mockRefreshConversations,
      startNewChat: jest.fn(),
      selectConversation: jest.fn(),
      filterConversations: jest.fn(),
    });

    render(<AIChatDock />);

    expect(screen.getByText(KONFLUX_AI_ERROR_UNAVAILABLE)).toBeInTheDocument();
  });

  it('shows a rename failure inside the open rename dialog', () => {
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: false,
      retryInit,
    });
    mockUseAIChatConversations.mockReturnValue({
      activeConversationId: null,
      conversations: [],
      conversationError: KONFLUX_AI_ERROR_UNAVAILABLE,
      hasNoSearchResults: false,
      deleteConversationTarget: null,
      isDeletingConversation: false,
      isLoadingConversations: false,
      isRenamingConversation: false,
      renameConversationTarget: { conversationId: 'conv-1', currentName: 'Pipeline failure' },
      closeDeleteConversation: jest.fn(),
      confirmDeleteConversation: jest.fn(),
      clearConversationError: jest.fn(),
      closeRenameConversation: jest.fn(),
      confirmRenameConversation: jest.fn(),
      refreshConversations: mockRefreshConversations,
      startNewChat: jest.fn(),
      selectConversation: jest.fn(),
      filterConversations: jest.fn(),
    });

    render(<AIChatDock />);

    expect(screen.getAllByText(KONFLUX_AI_ERROR_UNAVAILABLE)).toHaveLength(2);
  });
});
