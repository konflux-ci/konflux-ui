import { renderHook } from '@testing-library/react-hooks';
import { mockSecret, mockServiceAccounts } from '~/components/Secrets/__data__/mock-secrets';
import * as serviceAccountUtils from '~/components/Secrets/utils/service-account-utils';
import { BackgroundJobStatus } from '~/utils/task-store';
import { createK8sWatchResourceMock } from '~/utils/test-utils';
import { useLinkedServiceAccounts } from '../useLinkedServiceAccounts';

jest.mock('~/components/Secrets/utils/service-account-utils', () => ({
  ...jest.requireActual('~/components/Secrets/utils/service-account-utils'),
  filterLinkedServiceAccounts: jest.fn(),
}));

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useLinkedServiceAccounts', () => {
  const namespace = 'test-namespace';
  const watch = true;

  const mockFilterLinkedServiceAccounts =
    serviceAccountUtils.filterLinkedServiceAccounts as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array and loading true initially', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useLinkedServiceAccounts(namespace, mockSecret, watch));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.linkedServiceAccounts).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns filtered linked service accounts when data is loaded', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: mockServiceAccounts,
      isLoading: false,
      error: null,
    });
    const readySecret = {
      ...mockSecret,
      metadata: {
        ...mockSecret.metadata,
        annotations: {
          ...mockSecret.metadata?.annotations,
          'konflux-ui/linking-secret-action-status': BackgroundJobStatus.Succeeded,
        },
      },
    };

    const filteredAccounts = [mockServiceAccounts[1]];
    mockFilterLinkedServiceAccounts.mockReturnValue(filteredAccounts);

    const { result } = renderHook(() => useLinkedServiceAccounts(namespace, readySecret, watch));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.linkedServiceAccounts).toEqual(filteredAccounts);
    expect(mockFilterLinkedServiceAccounts).toHaveBeenCalledWith(
      readySecret.metadata.name,
      mockServiceAccounts,
    );
  });

  it('returns error when useK8sWatchResource returns error', () => {
    const mockError = new Error('Failed to load');
    useK8sWatchResourceMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useLinkedServiceAccounts(namespace, mockSecret, watch));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(result.current.linkedServiceAccounts).toEqual([]);
  });
});
