import { act, renderHook } from '@testing-library/react';
import type { ConversationDetails } from '@redhat-cloud-services/lightspeed-client';
import { KONFLUX_AI_ERROR_UNAVAILABLE } from '~/components/AIChat/const';
import { useAIChatConversationList } from '~/components/AIChat/hooks/useAIChatConversationList';

const mockUseClient = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useClient: () => mockUseClient(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
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

const untitledNewer = 'Untitled conversation, Feb 1, 2026, 12:00 AM';

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

describe('useAIChatConversationList', () => {
  const getConversations = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getConversations.mockResolvedValue({ conversations });
    mockUseClient.mockReturnValue({ getConversations });
  });

  const renderList = () => renderHook(() => useAIChatConversationList());

  it('loads history newest first and skips conversations without a timestamp', async () => {
    const { result } = renderList();

    await act(async () => {
      await result.current.refreshConversations();
    });

    expect(result.current.conversations).toEqual([
      { id: 'newer', text: untitledNewer },
      { id: 'older', text: 'Pipeline failure' },
    ]);
    expect(result.current.hasNoSearchResults).toBe(false);
    expect(result.current.conversationError).toBeUndefined();
  });

  it('filters loaded conversations and reports an empty search', async () => {
    const { result } = renderList();

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
    const { result } = renderList();

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
    const { result } = renderList();

    await act(async () => {
      await result.current.refreshConversations();
    });

    getConversations.mockRejectedValue(new Error('network down'));

    await act(async () => {
      await result.current.refreshConversations();
    });

    expect(result.current.conversations).toEqual([
      { id: 'newer', text: untitledNewer },
      { id: 'older', text: 'Pipeline failure' },
    ]);
    expect(result.current.isLoadingConversations).toBe(false);
    expect(result.current.conversationError).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to load Lightspeed conversations',
      expect.any(Error),
      undefined,
    );
  });

  it('applies the search typed while a refresh is in flight', async () => {
    let resolveConversations: (value: { conversations: ConversationDetails[] }) => void = () => {
      throw new Error('refresh was not started');
    };
    getConversations.mockReturnValue(
      new Promise((resolve) => {
        resolveConversations = resolve;
      }),
    );
    const { result } = renderList();

    let refreshPromise: Promise<void> = Promise.resolve();
    act(() => {
      refreshPromise = result.current.refreshConversations();
    });

    expect(result.current.isLoadingConversations).toBe(true);

    act(() => {
      result.current.filterConversations('pipeline');
    });

    await act(async () => {
      resolveConversations({ conversations });
      await refreshPromise;
    });

    expect(result.current.isLoadingConversations).toBe(false);
    expect(result.current.conversations).toEqual([{ id: 'older', text: 'Pipeline failure' }]);
  });

  it('ignores a stale refresh after a newer refresh starts', async () => {
    let resolveFirst: (value: { conversations: ConversationDetails[] }) => void = () => {
      throw new Error('first refresh was not started');
    };
    let resolveSecond: (value: { conversations: ConversationDetails[] }) => void = () => {
      throw new Error('second refresh was not started');
    };
    getConversations
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );

    const { result } = renderList();

    let firstRefresh: Promise<void> = Promise.resolve();
    let secondRefresh: Promise<void> = Promise.resolve();
    act(() => {
      firstRefresh = result.current.refreshConversations();
    });
    act(() => {
      secondRefresh = result.current.refreshConversations();
    });

    await act(async () => {
      resolveFirst({
        conversations: [
          wireConversation({
            id: 'stale',
            createdAt: '2026-01-01T00:00:00.000Z',
            lastMessageAt: '2026-01-01T00:00:00.000Z',
            messageCount: 1,
            topicSummary: 'Stale',
          }),
        ],
      });
      await firstRefresh;
    });

    expect(result.current.conversations).toEqual([]);
    expect(result.current.isLoadingConversations).toBe(true);

    await act(async () => {
      resolveSecond({ conversations });
      await secondRefresh;
    });

    expect(result.current.conversations).toEqual([
      { id: 'newer', text: untitledNewer },
      { id: 'older', text: 'Pipeline failure' },
    ]);
    expect(result.current.isLoadingConversations).toBe(false);
  });
});
