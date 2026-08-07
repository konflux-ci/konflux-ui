import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { createMockIssue } from '~/unit-test-utils/mock-issues';
import { createTestQueryClient } from '~/unit-test-utils/mock-react-query';
import { PLUGIN_KITE } from '../const';
import { IssueState } from '../issue-type';
import { resolveIssue } from '../kite-fetch';
import { useIssueActions } from '../kite-hooks';

const mockLoggerError = jest.fn();

jest.mock('../kite-fetch', () => ({
  resolveIssue: jest.fn(),
}));

jest.mock('~/components/modal/ModalProvider', () => ({
  ...jest.requireActual('~/components/modal/ModalProvider'),
  useModalLauncher: jest.fn(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockResolveIssue = resolveIssue as jest.MockedFunction<typeof resolveIssue>;
const mockUseModalLauncher = useModalLauncher as jest.Mock;

describe('useIssueActions', () => {
  let queryClient: QueryClient;
  const showModal = jest.fn();

  const renderActionsHook = (issue = createMockIssue()) =>
    renderHook(() => useIssueActions(issue), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    mockUseModalLauncher.mockReturnValue(showModal);
  });

  it('should return a Resolve action for an active issue', () => {
    const issue = createMockIssue({ id: 'issue-123', state: IssueState.ACTIVE });
    const { result } = renderActionsHook(issue);

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      id: 'resolve-issue-123',
      label: 'Resolve',
      disabled: false,
    });
  });

  it('should disable Resolve when the issue is already resolved', () => {
    const issue = createMockIssue({ state: IssueState.RESOLVED });
    const { result } = renderActionsHook(issue);

    expect(result.current[0]).toMatchObject({
      label: 'Resolve',
      disabled: true,
      disabledTooltip: 'Issue is already resolved',
    });
  });

  it('should call resolveIssue and invalidate kite queries on success', async () => {
    const issue = createMockIssue({ id: 'issue-123', namespace: 'test-ns' });
    const resolvedIssue = createMockIssue({ id: 'issue-123', state: IssueState.RESOLVED });
    mockResolveIssue.mockResolvedValue(resolvedIssue);

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderActionsHook(issue);

    const cta = result.current[0].cta;
    expect(typeof cta).toBe('function');
    (cta as () => void)();

    await waitFor(() => {
      expect(mockResolveIssue).toHaveBeenCalledWith('issue-123', 'test-ns');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [PLUGIN_KITE] });
    expect(showModal).not.toHaveBeenCalled();
  });

  it('should show an error modal when resolve fails', async () => {
    const issue = createMockIssue({ id: 'issue-123' });
    mockResolveIssue.mockRejectedValue(new Error('Network error'));

    const { result } = renderActionsHook(issue);
    (result.current[0].cta as () => void)();

    await waitFor(() => {
      expect(showModal).toHaveBeenCalled();
    });

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to resolve issue',
      expect.any(Error),
      { issueId: 'issue-123' },
    );
  });
});
