import { act, renderHook } from '@testing-library/react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { KONFLUX_AI_ERROR_NOT_FOUND, KONFLUX_AI_ERROR_UNAVAILABLE } from '~/components/AIChat/const';
import { useAIChatConversationActions } from '~/components/AIChat/hooks/useAIChatConversationActions';

const mockUseCreateNewConversation = jest.fn();
const mockUseSetActiveConversation = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useCreateNewConversation: () => mockUseCreateNewConversation(),
  useSetActiveConversation: () => mockUseSetActiveConversation(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

describe('useAIChatConversationActions', () => {
  const createNewConversation = jest.fn();
  const setActiveConversation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createNewConversation.mockResolvedValue({ id: 'fresh-chat' });
    setActiveConversation.mockResolvedValue(undefined);
    mockUseCreateNewConversation.mockReturnValue(createNewConversation);
    mockUseSetActiveConversation.mockReturnValue(setActiveConversation);
  });

  const renderActions = () => renderHook(() => useAIChatConversationActions());

  it('starts a new chat on the created conversation', async () => {
    const { result } = renderActions();

    let started = false;
    await act(async () => {
      started = await result.current.startNewChat();
    });

    expect(started).toBe(true);
    expect(createNewConversation).toHaveBeenCalledTimes(1);
    expect(setActiveConversation).toHaveBeenCalledWith('fresh-chat');
    expect(result.current.conversationError).toBeUndefined();
  });

  it('reports a new-chat failure without exposing the raw error', async () => {
    createNewConversation.mockRejectedValue(new AIClientError(404, 'Not Found', 'missing'));
    const { result } = renderActions();

    let started = true;
    await act(async () => {
      started = await result.current.startNewChat();
    });

    expect(started).toBe(false);
    expect(setActiveConversation).not.toHaveBeenCalled();
    expect(result.current.conversationError).toBe(KONFLUX_AI_ERROR_NOT_FOUND);
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to start new Lightspeed chat',
      expect.any(AIClientError),
      undefined,
    );
  });

  it('selects a conversation', async () => {
    const { result } = renderActions();

    await act(async () => {
      await result.current.selectConversation('older');
    });

    expect(setActiveConversation).toHaveBeenCalledWith('older');
    expect(result.current.conversationError).toBeUndefined();
  });

  it('reports a selection failure without exposing the raw error', async () => {
    setActiveConversation.mockRejectedValue(new Error('not found'));
    const { result } = renderActions();

    await act(async () => {
      await result.current.selectConversation('older');
    });

    expect(result.current.conversationError).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to load Lightspeed conversation',
      expect.any(Error),
      { conversationId: 'older' },
    );
  });
});
