import * as React from 'react';
import type { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatHistoryNav } from '~/components/AIChat/components/AIChatHistoryNav';
import {
  KONFLUX_AI_ERROR_TITLE,
  KONFLUX_AI_HISTORY_NO_RESULTS_BODY,
  KONFLUX_AI_HISTORY_NO_RESULTS_TITLE,
  KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER,
} from '~/components/AIChat/const';

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav', () => ({
  __esModule: true,
  default: ({
    conversations,
    drawerContent,
    errorState,
    handleTextInputChange,
    isDrawerOpen,
    isLoading,
    noResultsState,
    onDrawerToggle,
    onNewChat,
    onSelectActiveItem,
    searchInputPlaceholder,
  }: {
    conversations: Conversation[];
    drawerContent: React.ReactNode;
    errorState?: { titleText: string; bodyText: string };
    handleTextInputChange: (value: string) => void;
    isDrawerOpen: boolean;
    isLoading?: boolean;
    noResultsState?: { titleText: string; bodyText: string };
    onDrawerToggle: () => void;
    onNewChat: () => void;
    onSelectActiveItem: (
      event: React.MouseEvent | undefined,
      conversationId?: string | number,
    ) => void;
    searchInputPlaceholder: string;
  }) => (
    <div>
      <button type="button" aria-expanded={isDrawerOpen} onClick={onDrawerToggle}>
        History
      </button>
      <button type="button" onClick={onNewChat}>
        New chat
      </button>
      <button type="button" onClick={() => onSelectActiveItem(undefined, conversations[0]?.id)}>
        Select conversation
      </button>
      <button type="button" onClick={() => onSelectActiveItem(undefined, undefined)}>
        Select nothing
      </button>
      <input
        aria-label={searchInputPlaceholder}
        onChange={(event) => handleTextInputChange(event.target.value)}
      />
      {isLoading ? <p>Loading conversations</p> : null}
      {errorState ? (
        <div>
          <p>{errorState.titleText}</p>
          <p>{errorState.bodyText}</p>
        </div>
      ) : null}
      {noResultsState ? (
        <div>
          <p>{noResultsState.titleText}</p>
          <p>{noResultsState.bodyText}</p>
        </div>
      ) : null}
      <div>{drawerContent}</div>
    </div>
  ),
}));

jest.mock('~/components/AIChat/components/AIChatHeader', () => ({
  AIChatHeader: ({
    onClose,
    onToggleDrawer,
  }: {
    onClose: () => void;
    onToggleDrawer?: () => void;
  }) => (
    <>
      <button type="button" onClick={onToggleDrawer}>
        Header history
      </button>
      <button type="button" onClick={onClose}>
        Close chat
      </button>
    </>
  ),
}));

const conversations: Conversation[] = [{ id: 'older', text: 'Pipeline failure' }];

const renderHistoryNav = (
  overrides: Partial<React.ComponentProps<typeof AIChatHistoryNav>> = {},
) => {
  const props = {
    displayMode: 'default' as ChatbotDisplayMode,
    activeConversationId: null,
    conversations,
    hasNoSearchResults: false,
    isLoadingConversations: false,
    refreshConversations: jest.fn().mockResolvedValue(undefined),
    startNewChat: jest.fn().mockResolvedValue(undefined),
    selectConversation: jest.fn().mockResolvedValue(undefined),
    filterConversations: jest.fn(),
    onCloseChat: jest.fn(),
    ...overrides,
  };

  render(
    <AIChatHistoryNav {...props}>
      <p>Chat messages</p>
    </AIChatHistoryNav>,
  );

  return props;
};

describe('AIChatHistoryNav', () => {
  it('refreshes conversations when the history drawer opens', async () => {
    const user = userEvent.setup();
    const props = renderHistoryNav();

    const historyButton = screen.getByRole('button', { name: 'History' });
    await user.click(historyButton);

    expect(props.refreshConversations).toHaveBeenCalledTimes(1);
    expect(historyButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not refresh conversations when the history drawer closes', async () => {
    const user = userEvent.setup();
    const props = renderHistoryNav();
    const historyButton = screen.getByRole('button', { name: 'History' });

    await user.click(historyButton);
    await user.click(historyButton);

    expect(props.refreshConversations).toHaveBeenCalledTimes(1);
    expect(historyButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts a new chat and closes the drawer', async () => {
    const user = userEvent.setup();
    const props = renderHistoryNav();
    const historyButton = screen.getByRole('button', { name: 'History' });

    await user.click(historyButton);
    await user.click(screen.getByRole('button', { name: 'New chat' }));

    expect(historyButton).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => {
      expect(props.startNewChat).toHaveBeenCalledTimes(1);
      expect(props.refreshConversations).toHaveBeenCalledTimes(2);
    });
  });

  it('selects a conversation and closes the drawer', async () => {
    const user = userEvent.setup();
    const props = renderHistoryNav();
    const historyButton = screen.getByRole('button', { name: 'History' });

    await user.click(historyButton);
    await user.click(screen.getByRole('button', { name: 'Select conversation' }));

    await waitFor(() => {
      expect(props.selectConversation).toHaveBeenCalledWith('older');
    });
    expect(historyButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('ignores a selection that has no conversation id', async () => {
    const user = userEvent.setup();
    const props = renderHistoryNav({ conversations: [] });
    const historyButton = screen.getByRole('button', { name: 'History' });

    await user.click(historyButton);
    await user.click(screen.getByRole('button', { name: 'Select nothing' }));

    expect(props.selectConversation).not.toHaveBeenCalled();
    expect(historyButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('filters conversations from the search field', async () => {
    const user = userEvent.setup();
    const props = renderHistoryNav();

    await user.type(screen.getByRole('textbox', { name: KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER }), 'pipe');

    expect(props.filterConversations).toHaveBeenLastCalledWith('pipe');
  });

  it('shows a loading state while conversations are refreshing', () => {
    renderHistoryNav({ isLoadingConversations: true });

    expect(screen.getByText('Loading conversations')).toBeInTheDocument();
  });

  it('shows a conversation error in the history drawer', () => {
    renderHistoryNav({ conversationError: 'Konflux AI is temporarily unavailable.' });

    expect(screen.getByText(KONFLUX_AI_ERROR_TITLE)).toBeInTheDocument();
    expect(screen.getByText('Konflux AI is temporarily unavailable.')).toBeInTheDocument();
  });

  it('shows the empty search state and renders the chat inside the drawer', () => {
    const onCloseChat = jest.fn();
    renderHistoryNav({ hasNoSearchResults: true, onCloseChat });

    expect(screen.getByText(KONFLUX_AI_HISTORY_NO_RESULTS_TITLE)).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_HISTORY_NO_RESULTS_BODY)).toBeInTheDocument();
    expect(screen.getByText('Chat messages')).toBeInTheDocument();
  });

  it('closes the chat from the header', async () => {
    const user = userEvent.setup();
    const props = renderHistoryNav();

    await user.click(screen.getByRole('button', { name: 'Close chat' }));

    expect(props.onCloseChat).toHaveBeenCalledTimes(1);
  });
});
