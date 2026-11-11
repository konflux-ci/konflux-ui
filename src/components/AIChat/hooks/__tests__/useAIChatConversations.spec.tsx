import * as React from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import type { ConversationDetails } from '@redhat-cloud-services/lightspeed-client';
import {
  LightspeedClientError,
  TEMP_CONVERSATION_ID as LIGHTSPEED_TEMP_CONVERSATION_ID,
} from '@redhat-cloud-services/lightspeed-client';
import {
  KONFLUX_AI_ERROR_NOT_FOUND,
  KONFLUX_AI_ERROR_PERMISSION,
  KONFLUX_AI_ERROR_UNAVAILABLE,
} from '~/components/AIChat/const';
import { useAIChatConversations } from '~/components/AIChat/hooks/useAIChatConversations';

const mockUseClient = jest.fn();
const mockUseActiveConversation = jest.fn();
const mockUseCreateNewConversation = jest.fn();
const mockUseSetActiveConversation = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useClient: () => mockUseClient(),
  useActiveConversation: () => mockUseActiveConversation(),
  useCreateNewConversation: () => mockUseCreateNewConversation(),
  useSetActiveConversation: () => mockUseSetActiveConversation(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
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
      { id: 'newer', text: untitledNewer },
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
      { id: 'newer', text: untitledNewer },
      { id: 'older', text: 'Pipeline failure' },
    ]);
    expect(result.current.conversationError).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    expect(result.current.isLoadingConversations).toBe(false);
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
    const { result } = renderHook(() => useAIChatConversations());

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

  it('starts a new chat on the created conversation', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.startNewChat();
    });

    expect(createNewConversation).toHaveBeenCalledTimes(1);
    expect(setActiveConversation).toHaveBeenCalledWith('fresh-chat');
  });

  it('reports a new-chat failure without exposing the raw error', async () => {
    createNewConversation.mockRejectedValue(new AIClientError(404, 'Not Found', 'missing'));
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.startNewChat();
    });

    expect(setActiveConversation).not.toHaveBeenCalled();
    expect(result.current.conversationError).toBe(KONFLUX_AI_ERROR_NOT_FOUND);
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to start new Lightspeed chat',
      expect.any(AIClientError),
      undefined,
    );
  });

  it('selects a conversation', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.selectConversation('older');
    });

    expect(setActiveConversation).toHaveBeenCalledWith('older');
  });

  it('reports a selection failure without exposing the raw error', async () => {
    setActiveConversation.mockRejectedValue(new Error('not found'));
    const { result } = renderHook(() => useAIChatConversations());

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

describe('conversation rename and delete', () => {
  const getConversations = jest.fn();
  const updateConversation = jest.fn();
  const deleteConversation = jest.fn();
  const createNewConversation = jest.fn();
  const setActiveConversation = jest.fn();

  const namedConversation = (): ConversationDetails => {
    const conversation: Record<string, unknown> = {};
    conversation[wireField.id] = 'conv-1';
    conversation[wireField.createdAt] = '2026-02-01T00:00:00.000Z';
    conversation[wireField.lastMessageAt] = '2026-02-01T00:00:00.000Z';
    conversation[wireField.messageCount] = 2;
    conversation[wireField.topicSummary] = 'Pipeline failure';
    return conversation as unknown as ConversationDetails;
  };

  const renderLoadedHistory = async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.refreshConversations();
    });

    const menuItems = result.current.conversations[0]?.menuItems;
    if (!React.isValidElement(menuItems)) {
      throw new Error('Expected conversation menu items');
    }
    render(menuItems);

    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getConversations.mockResolvedValue({ conversations: [namedConversation()] });
    updateConversation.mockResolvedValue(undefined);
    deleteConversation.mockResolvedValue(undefined);
    createNewConversation.mockResolvedValue({ id: 'fresh-chat' });
    setActiveConversation.mockResolvedValue(undefined);
    mockUseClient.mockReturnValue({ getConversations, updateConversation, deleteConversation });
    mockUseActiveConversation.mockReturnValue(undefined);
    mockUseCreateNewConversation.mockReturnValue(createNewConversation);
    mockUseSetActiveConversation.mockReturnValue(setActiveConversation);
  });

  it('renames through LightspeedClient.updateConversation and reloads history', async () => {
    const user = userEvent.setup();
    const result = await renderLoadedHistory();

    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));

    expect(result.current.renameConversationTarget).toEqual({
      conversationId: 'conv-1',
      currentName: 'Pipeline failure',
    });
    expect(result.current.historyMenuKey).toBe(1);

    await act(async () => {
      await result.current.confirmRenameConversation('Renamed chat');
    });

    expect(updateConversation).toHaveBeenCalledWith('conv-1', 'Renamed chat');
    expect(getConversations).toHaveBeenCalledTimes(2);
    expect(result.current.renameConversationTarget).toBeNull();
    expect(result.current.isRenamingConversation).toBe(false);
    expect(result.current.conversationError).toBeUndefined();
  });

  it('keeps the rename dialog open when updateConversation fails', async () => {
    updateConversation.mockRejectedValue(new LightspeedClientError(404, 'Not Found', 'missing'));
    const user = userEvent.setup();
    const result = await renderLoadedHistory();

    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));

    await act(async () => {
      await result.current.confirmRenameConversation('Renamed chat');
    });

    expect(result.current.conversationError).toBe(KONFLUX_AI_ERROR_NOT_FOUND);
    expect(result.current.conversationError).not.toContain('missing');
    expect(result.current.renameConversationTarget).toEqual({
      conversationId: 'conv-1',
      currentName: 'Pipeline failure',
    });
    expect(getConversations).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Failed to rename Lightspeed conversation',
      expect.objectContaining({ conversationId: 'conv-1' }),
    );
  });

  it('hides raw rename failures behind the unavailable message', async () => {
    updateConversation.mockRejectedValue(new Error('https://internal.example/secret'));
    const user = userEvent.setup();
    const result = await renderLoadedHistory();

    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));

    await act(async () => {
      await result.current.confirmRenameConversation('Renamed chat');
    });

    expect(result.current.conversationError).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    expect(result.current.conversationError).not.toContain('internal.example');
  });

  it('does not call updateConversation when no rename is open', async () => {
    const { result } = renderHook(() => useAIChatConversations());

    await act(async () => {
      await result.current.confirmRenameConversation('Renamed chat');
    });

    expect(updateConversation).not.toHaveBeenCalled();
  });

  it('closes the rename dialog without calling the client', async () => {
    const user = userEvent.setup();
    const result = await renderLoadedHistory();

    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));
    act(() => {
      result.current.closeRenameConversation();
    });

    expect(result.current.renameConversationTarget).toBeNull();
    expect(updateConversation).not.toHaveBeenCalled();
  });

  it('deletes through LightspeedClient.deleteConversation and reloads history', async () => {
    const user = userEvent.setup();
    await renderLoadedHistory();

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteConversation).toHaveBeenCalledWith('conv-1');
    });
    expect(getConversations).toHaveBeenCalledTimes(2);
    expect(createNewConversation).not.toHaveBeenCalled();
  });

  it('starts a new chat when the active conversation is deleted', async () => {
    mockUseActiveConversation.mockReturnValue({ id: 'conv-1' });
    const user = userEvent.setup();
    await renderLoadedHistory();

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteConversation).toHaveBeenCalledWith('conv-1');
    });
    expect(createNewConversation).toHaveBeenCalledTimes(1);
    expect(setActiveConversation).toHaveBeenCalledWith('fresh-chat');
  });

  it('maps delete failures and leaves the current chat in place', async () => {
    mockUseActiveConversation.mockReturnValue({ id: 'conv-1' });
    deleteConversation.mockRejectedValue(new AIClientError(403, 'Forbidden', 'denied'));
    const user = userEvent.setup();
    const result = await renderLoadedHistory();

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    await waitFor(() => {
      expect(result.current.conversationError).toBe(KONFLUX_AI_ERROR_PERMISSION);
    });
    expect(result.current.conversationError).not.toContain('denied');
    expect(createNewConversation).not.toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Failed to delete Lightspeed conversation',
      expect.objectContaining({ conversationId: 'conv-1' }),
    );
  });
});
