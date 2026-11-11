import { act, renderHook } from '@testing-library/react';
import type { ConversationDetails } from '@redhat-cloud-services/lightspeed-client';
import { TEMP_CONVERSATION_ID as LIGHTSPEED_TEMP_CONVERSATION_ID } from '@redhat-cloud-services/lightspeed-client';
import { useAIChatConversations } from '~/components/AIChat/hooks/useAIChatConversations';

const mockUseClient = jest.fn();
const mockUseActiveConversation = jest.fn();
const mockUseCreateNewConversation = jest.fn();
const mockUseSetActiveConversation = jest.fn();
const mockLoggerWarn = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useClient: () => mockUseClient(),
  useActiveConversation: () => mockUseActiveConversation(),
  useCreateNewConversation: () => mockUseCreateNewConversation(),
  useSetActiveConversation: () => mockUseSetActiveConversation(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  },
}));

const wireField = {
  id: 'conversation_id',
  createdAt: 'created_at',
  lastMessageAt: 'last_message_at',
  messageCount: 'message_count',
  topicSummary: 'topic_summary',
} as const;

const wireConversation = (input: {
  id: string;
  createdAt: string | null;
  lastMessageAt: string | null;
  messageCount: number | null;
  topicSummary?: string;
}): ConversationDetails => {
  const conversation: Record<string, unknown> = {};
  conversation[wireField.id] = input.id;
  conversation[wireField.createdAt] = input.createdAt;
  conversation[wireField.lastMessageAt] = input.lastMessageAt;
  conversation[wireField.messageCount] = input.messageCount;
  conversation[wireField.topicSummary] = input.topicSummary;
  return conversation as unknown as ConversationDetails;
};

const conversations: ConversationDetails[] = [
  wireConversation({
    id: 'older',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    messageCount: 2,
    topicSummary: '  Pipeline failure  ',
  }),
  wireConversation({
    id: 'newer',
    createdAt: null,
    lastMessageAt: '2026-02-01T00:00:00.000Z',
    messageCount: null,
    topicSummary: '   ',
  }),
  wireConversation({
    id: 'missing-time',
    createdAt: '2026-03-01T00:00:00.000Z',
    lastMessageAt: null,
    messageCount: 1,
    topicSummary: 'Skipped',
  }),
];

describe('useAIChatConversations', () => {
  const getConversations = jest.fn();
  const createNewConversation = jest.fn();
  const setActiveConversation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getConversations.mockResolvedValue({ conversations });
    createNewConversation.mockResolvedValue({ id: 'fresh-chat' });
    setActiveConversation.mockResolvedValue(undefined);
    mockUseClient.mockReturnValue({ getConversations });
    mockUseActiveConversation.mockReturnValue(undefined);
    mockUseCreateNewConversation.mockReturnValue(createNewConversation);
    mockUseSetActiveConversation.mockReturnValue(setActiveConversation);
  });

  it.each([
    undefined,
    { id: '' },
    { id: '__temp_conversation__' },
    { id: LIGHTSPEED_TEMP_CONVERSATION_ID },
  ])('hides a temporary active conversation (%j)', (activeConversation) => {
    mockUseActiveConversation.mockReturnValue(activeConversation);

    const { result } = renderHook(() => useAIChatConversations());

    expect(result.current.activeConversationId).toBeNull();
  });

  it('exposes a saved active conversation id', () => {
    mockUseActiveConversation.mockReturnValue({ id: 'older' });

    const { result } = renderHook(() => useAIChatConversations());

    expect(result.current.activeConversationId).toBe('older');
  });

  it('loads history newest first and skips conversations without a timestamp', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.refreshConversations();
    });

    expect(result.current.conversations).toEqual([
      { id: 'newer', text: 'Untitled conversation' },
      { id: 'older', text: 'Pipeline failure' },
    ]);
    expect(result.current.hasNoSearchResults).toBe(false);
  });

  it('filters loaded conversations and reports an empty search', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.refreshConversations();
    });

    act(() => {
      result.current.filterConversations('pipeline');
    });

    expect(result.current.conversations).toEqual([{ id: 'older', text: 'Pipeline failure' }]);
    expect(result.current.hasNoSearchResults).toBe(false);

    act(() => {
      result.current.filterConversations('missing');
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.hasNoSearchResults).toBe(true);
  });

  it('keeps the current search when the list is refreshed', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.refreshConversations();
    });

    act(() => {
      result.current.filterConversations('pipeline');
    });

    await act(async () => {
      await result.current.refreshConversations();
    });

    expect(result.current.conversations).toEqual([{ id: 'older', text: 'Pipeline failure' }]);
  });

  it('keeps the previous list when loading conversations fails', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.refreshConversations();
    });

    getConversations.mockRejectedValue(new Error('network down'));

    await act(async () => {
      await result.current.refreshConversations();
    });

    expect(result.current.conversations).toEqual([
      { id: 'newer', text: 'Untitled conversation' },
      { id: 'older', text: 'Pipeline failure' },
    ]);
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Failed to load Lightspeed conversations',
      expect.objectContaining({ error: 'network down' }),
    );
  });

  it('starts a new chat on the created conversation', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.startNewChat();
    });

    expect(createNewConversation).toHaveBeenCalledTimes(1);
    expect(setActiveConversation).toHaveBeenCalledWith('fresh-chat');
  });

  it('logs a warning when starting a new chat fails', async () => {
    createNewConversation.mockRejectedValue(new Error('create failed'));
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.startNewChat();
    });

    expect(setActiveConversation).not.toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Failed to start new Lightspeed chat',
      expect.objectContaining({ error: 'create failed' }),
    );
  });

  it('selects a conversation', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.selectConversation('older');
    });

    expect(setActiveConversation).toHaveBeenCalledWith('older');
  });

  it('logs a warning when selecting a conversation fails', async () => {
    setActiveConversation.mockRejectedValue(new Error('not found'));
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.selectConversation('older');
    });

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Failed to load Lightspeed conversation',
      expect.objectContaining({ conversationId: 'older', error: 'not found' }),
    );
  });
});
