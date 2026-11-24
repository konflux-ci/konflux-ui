import { act, renderHook } from '@testing-library/react';
import { useAIChatConversations } from '~/components/AIChat/hooks/useAIChatConversations';

const mockUseAIChatActiveConversationId = jest.fn();
const mockUseAIChatConversationList = jest.fn();
const mockUseAIChatConversationActions = jest.fn();

jest.mock('~/components/AIChat/hooks/useAIChatActiveConversationId', () => ({
  useAIChatActiveConversationId: () => mockUseAIChatActiveConversationId(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatConversationList', () => ({
  useAIChatConversationList: () => mockUseAIChatConversationList(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatConversationActions', () => ({
  useAIChatConversationActions: () => mockUseAIChatConversationActions(),
}));

describe('useAIChatConversations', () => {
  const clearListError = jest.fn();
  const clearActionError = jest.fn();
  const refreshConversationList = jest.fn();
  const startConversationChat = jest.fn();
  const selectActiveConversation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    refreshConversationList.mockResolvedValue(undefined);
    startConversationChat.mockResolvedValue(true);
    selectActiveConversation.mockResolvedValue(undefined);
    mockUseAIChatActiveConversationId.mockReturnValue('older');
    mockUseAIChatConversationList.mockReturnValue({
      conversations: [{ id: 'older', text: 'Pipeline failure' }],
      conversationError: 'list error',
      hasNoSearchResults: false,
      isLoadingConversations: false,
      clearConversationError: clearListError,
      refreshConversations: refreshConversationList,
      filterConversations: jest.fn(),
    });
    mockUseAIChatConversationActions.mockReturnValue({
      conversationError: undefined,
      clearConversationError: clearActionError,
      startNewChat: startConversationChat,
      selectConversation: selectActiveConversation,
    });
  });

  it('composes the active id, list, and action hooks', () => {
    const { result } = renderHook(() => useAIChatConversations());

    expect(result.current.activeConversationId).toBe('older');
    expect(result.current.conversations).toEqual([{ id: 'older', text: 'Pipeline failure' }]);
    expect(result.current.conversationError).toBe('list error');
  });

  it('prefers an action error over a list error', () => {
    mockUseAIChatConversationActions.mockReturnValue({
      conversationError: 'action error',
      clearConversationError: clearActionError,
      startNewChat: startConversationChat,
      selectConversation: selectActiveConversation,
    });

    const { result } = renderHook(() => useAIChatConversations());

    expect(result.current.conversationError).toBe('action error');
  });

  it('clears the other side error before refreshing or mutating', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.refreshConversations();
      await result.current.startNewChat();
      await result.current.selectConversation('older');
    });

    expect(clearActionError).toHaveBeenCalledTimes(1);
    expect(refreshConversationList).toHaveBeenCalledTimes(1);
    expect(clearListError).toHaveBeenCalledTimes(2);
    expect(startConversationChat).toHaveBeenCalledTimes(1);
    expect(selectActiveConversation).toHaveBeenCalledWith('older');
  });
});
