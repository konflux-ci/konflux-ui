import { act, renderHook } from '@testing-library/react';
import { useAIChatHistoryDrawer } from '~/components/AIChat/hooks/useAIChatHistoryDrawer';

describe('useAIChatHistoryDrawer', () => {
  const refreshConversations = jest.fn();
  const startNewChat = jest.fn();
  const selectConversation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    refreshConversations.mockResolvedValue(undefined);
    startNewChat.mockResolvedValue(true);
    selectConversation.mockResolvedValue(undefined);
  });

  const renderDrawer = () =>
    renderHook(() =>
      useAIChatHistoryDrawer({
        refreshConversations,
        startNewChat,
        selectConversation,
      }),
    );

  it('refreshes conversations when opening the drawer', () => {
    const { result } = renderDrawer();

    act(() => {
      result.current.handleToggleDrawer();
    });

    expect(refreshConversations).toHaveBeenCalledTimes(1);
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it('does not refresh when closing the drawer', () => {
    const { result } = renderDrawer();

    act(() => {
      result.current.handleToggleDrawer();
    });
    act(() => {
      result.current.handleToggleDrawer();
    });

    expect(refreshConversations).toHaveBeenCalledTimes(1);
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it('closes the drawer and refreshes after a successful new chat', async () => {
    const { result } = renderDrawer();

    act(() => {
      result.current.setIsDrawerOpen(true);
    });
    act(() => {
      result.current.handleNewChat();
    });

    expect(result.current.isDrawerOpen).toBe(false);
    expect(startNewChat).toHaveBeenCalledTimes(1);

    await act(async () => {
      await Promise.resolve();
    });

    expect(refreshConversations).toHaveBeenCalledTimes(1);
  });

  it('keeps a failed new chat error on screen by skipping refresh', async () => {
    startNewChat.mockResolvedValue(false);
    const { result } = renderDrawer();

    act(() => {
      result.current.handleNewChat();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(refreshConversations).not.toHaveBeenCalled();
  });

  it('selects a conversation and closes the drawer', () => {
    const { result } = renderDrawer();

    act(() => {
      result.current.setIsDrawerOpen(true);
    });
    act(() => {
      result.current.handleSelectConversation(undefined, 'conversation-1');
    });

    expect(selectConversation).toHaveBeenCalledWith('conversation-1');
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it('ignores selection without a conversation id', () => {
    const { result } = renderDrawer();

    act(() => {
      result.current.handleSelectConversation(undefined, undefined);
    });

    expect(selectConversation).not.toHaveBeenCalled();
  });
});
