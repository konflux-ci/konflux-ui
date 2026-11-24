import { renderHook } from '@testing-library/react';
import { useAIChatConversations } from '~/components/AIChat/hooks/useAIChatConversations';

const mockUseAIChatActiveConversationId = jest.fn();
const mockUseAIChatConversationList = jest.fn();
const mockUseAIChatConversationActions = jest.fn();

jest.mock('~/components/AIChat/hooks/useAIChatActiveConversationId', () => ({
  useAIChatActiveConversationId: () => mockUseAIChatActiveConversationId(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatConversationList', () => ({
  useAIChatConversationList: (...args: unknown[]) => mockUseAIChatConversationList(...args),
}));

jest.mock('~/components/AIChat/hooks/useAIChatConversationActions', () => ({
  useAIChatConversationActions: (...args: unknown[]) => mockUseAIChatConversationActions(...args),
}));

describe('useAIChatConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAIChatActiveConversationId.mockReturnValue('older');
    mockUseAIChatConversationList.mockReturnValue({
      conversations: [{ id: 'older', text: 'Pipeline failure' }],
      hasNoSearchResults: false,
      isLoadingConversations: false,
      refreshConversations: jest.fn(),
      filterConversations: jest.fn(),
    });
    mockUseAIChatConversationActions.mockReturnValue({
      startNewChat: jest.fn(),
      selectConversation: jest.fn(),
    });
  });

  it('composes the active id, list, and action hooks', () => {
    const { result } = renderHook(() => useAIChatConversations());

    expect(result.current.activeConversationId).toBe('older');
    expect(result.current.conversations).toEqual([{ id: 'older', text: 'Pipeline failure' }]);
    expect(result.current.conversationError).toBeUndefined();
    expect(mockUseAIChatConversationList).toHaveBeenCalledWith({
      setConversationError: expect.any(Function),
    });
    expect(mockUseAIChatConversationActions).toHaveBeenCalledWith({
      setConversationError: expect.any(Function),
    });
  });
});
