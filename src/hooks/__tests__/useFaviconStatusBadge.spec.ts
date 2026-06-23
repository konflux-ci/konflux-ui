import { renderHook } from '@testing-library/react-hooks';
import { runStatus } from '~/consts/pipelinerun';
import * as faviconBadge from '~/shared/utils/favicon-badge';
import { useFaviconStatusBadge } from '../useFaviconStatusBadge';

jest.mock('~/shared/utils/favicon-badge', () => ({
  applyFaviconBadge: jest.fn().mockResolvedValue(undefined),
  restoreFavicon: jest.fn(),
}));

const applyFaviconBadgeMock = faviconBadge.applyFaviconBadge as jest.Mock;
const restoreFaviconMock = faviconBadge.restoreFavicon as jest.Mock;

describe('useFaviconStatusBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies favicon badge when status is provided', () => {
    renderHook(() => useFaviconStatusBadge(runStatus.Running));

    expect(applyFaviconBadgeMock).toHaveBeenCalledWith(runStatus.Running, expect.any(Function));
  });

  it('applies favicon badge when status changes', () => {
    const { rerender } = renderHook(({ status }) => useFaviconStatusBadge(status), {
      initialProps: { status: runStatus.Running },
    });

    rerender({ status: runStatus.Succeeded });

    expect(applyFaviconBadgeMock).toHaveBeenCalledTimes(2);
    expect(applyFaviconBadgeMock).toHaveBeenLastCalledWith(
      runStatus.Succeeded,
      expect.any(Function),
    );
  });

  it('restores favicon on unmount', () => {
    const { unmount } = renderHook(() => useFaviconStatusBadge(runStatus.Running));

    unmount();

    expect(restoreFaviconMock).toHaveBeenCalled();
  });

  it('restores favicon when status becomes null', () => {
    const { rerender } = renderHook(({ status }) => useFaviconStatusBadge(status), {
      initialProps: { status: runStatus.Running as runStatus | null },
    });

    rerender({ status: null });

    expect(applyFaviconBadgeMock).toHaveBeenLastCalledWith(null, expect.any(Function));
    expect(restoreFaviconMock).toHaveBeenCalled();
  });

  it('passes a cancellation callback that applyFaviconBadge can use', () => {
    let isCancelled: (() => boolean) | undefined;
    applyFaviconBadgeMock.mockImplementation((_status, cancelled) => {
      isCancelled = cancelled;
      return Promise.resolve();
    });

    const { unmount } = renderHook(() => useFaviconStatusBadge(runStatus.Running));

    expect(isCancelled?.()).toBe(false);
    unmount();
    expect(isCancelled?.()).toBe(true);
  });
});
