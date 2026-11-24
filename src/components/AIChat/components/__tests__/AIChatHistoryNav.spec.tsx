import * as React from 'react';
import type { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatHistoryNav } from '~/components/AIChat/components/AIChatHistoryNav';
import {
  KONFLUX_AI_ERROR_TITLE,
  KONFLUX_AI_HISTORY_NO_RESULTS_BODY,
  KONFLUX_AI_HISTORY_NO_RESULTS_TITLE,
  KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER,
} from '~/components/AIChat/const';
import type { UseAIChatConversationsResult } from '~/components/AIChat/hooks/useAIChatConversations';

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav', () => ({
  __esModule: true,
  default: ({
    drawerContent,
    errorState,
    handleTextInputChange,
    isDrawerOpen,
    isLoading,
    noResultsState,
    onDrawerToggle,
    searchInputPlaceholder,
  }: {
    drawerContent: React.ReactNode;
    errorState?: { titleText: string; bodyText: string };
    handleTextInputChange: (value: string) => void;
    isDrawerOpen: boolean;
    isLoading?: boolean;
    noResultsState?: { titleText: string; bodyText: string };
    onDrawerToggle: () => void;
    searchInputPlaceholder: string;
  }) => (
    <div>
      <button type="button" aria-expanded={isDrawerOpen} onClick={onDrawerToggle}>
        History
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

const createHistory = (
  overrides: Partial<UseAIChatConversationsResult> = {},
): UseAIChatConversationsResult => ({
  activeConversationId: null,
  conversations,
  hasNoSearchResults: false,
  isLoadingConversations: false,
  refreshConversations: jest.fn(),
  startNewChat: jest.fn(),
  selectConversation: jest.fn(),
  filterConversations: jest.fn(),
  ...overrides,
});

const renderHistoryNav = (
  overrides: {
    history?: Partial<UseAIChatConversationsResult>;
    onCloseChat?: jest.Mock;
  } = {},
) => {
  const history = createHistory(overrides.history);
  const onCloseChat = overrides.onCloseChat ?? jest.fn();

  render(
    <AIChatHistoryNav
      displayMode={'default' as ChatbotDisplayMode}
      history={history}
      onCloseChat={onCloseChat}
    >
      <p>Chat messages</p>
    </AIChatHistoryNav>,
  );

  return { history, onCloseChat };
};

describe('AIChatHistoryNav', () => {
  it('wires the header history toggle into the drawer', async () => {
    const user = userEvent.setup();
    renderHistoryNav();

    const historyButton = screen.getByRole('button', { name: 'History' });
    expect(historyButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Header history' }));

    expect(historyButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('filters conversations from the search field', async () => {
    const user = userEvent.setup();
    const { history } = renderHistoryNav();

    await user.type(
      screen.getByRole('textbox', { name: KONFLUX_AI_HISTORY_SEARCH_PLACEHOLDER }),
      'pipe',
    );

    expect(history.filterConversations).toHaveBeenLastCalledWith('pipe');
  });

  it('shows a loading state while conversations are refreshing', () => {
    renderHistoryNav({ history: { isLoadingConversations: true } });

    expect(screen.getByText('Loading conversations')).toBeInTheDocument();
  });

  it('shows a conversation error in the history drawer', () => {
    renderHistoryNav({
      history: { conversationError: 'Konflux AI is temporarily unavailable.' },
    });

    expect(screen.getByText(KONFLUX_AI_ERROR_TITLE)).toBeInTheDocument();
    expect(screen.getByText('Konflux AI is temporarily unavailable.')).toBeInTheDocument();
  });

  it('shows the empty search state and renders the chat inside the drawer', () => {
    renderHistoryNav({ history: { hasNoSearchResults: true } });

    expect(screen.getByText(KONFLUX_AI_HISTORY_NO_RESULTS_TITLE)).toBeInTheDocument();
    expect(screen.getByText(KONFLUX_AI_HISTORY_NO_RESULTS_BODY)).toBeInTheDocument();
    expect(screen.getByText('Chat messages')).toBeInTheDocument();
  });

  it('closes the chat from the header', async () => {
    const user = userEvent.setup();
    const { onCloseChat } = renderHistoryNav();

    await user.click(screen.getByRole('button', { name: 'Close chat' }));

    expect(onCloseChat).toHaveBeenCalledTimes(1);
  });
});
