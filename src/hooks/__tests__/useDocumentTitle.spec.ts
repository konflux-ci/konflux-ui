import { renderHook } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import * as faviconBadge from '~/shared/utils/favicon-badge';
import { useDocumentTitle } from '../useDocumentTitle';

jest.mock('~/shared/utils/favicon-badge', () => ({
  applyFaviconBadge: jest.fn().mockResolvedValue(undefined),
  acquireFaviconBadge: jest.fn(),
  releaseFaviconBadge: jest.fn(),
}));

const applyFaviconBadgeMock = faviconBadge.applyFaviconBadge as jest.Mock;
const acquireFaviconBadgeMock = faviconBadge.acquireFaviconBadge as jest.Mock;
const releaseFaviconBadgeMock = faviconBadge.releaseFaviconBadge as jest.Mock;

describe('useDocumentTitle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.title = 'Konflux';
  });

  it('sets document title and restores default on unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('My Page | Konflux'));

    expect(document.title).toBe('My Page | Konflux');

    unmount();

    expect(document.title).toBe('Konflux');
    expect(applyFaviconBadgeMock).not.toHaveBeenCalled();
    expect(releaseFaviconBadgeMock).not.toHaveBeenCalled();
  });

  it('updates title when it changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'First | Konflux' },
    });

    rerender({ title: 'Second | Konflux' });

    expect(document.title).toBe('Second | Konflux');
  });

  it('applies favicon badge when faviconStatus is provided', () => {
    renderHook(() => useDocumentTitle('Pipeline | Konflux', { faviconStatus: runStatus.Running }));

    expect(acquireFaviconBadgeMock).toHaveBeenCalled();
    expect(applyFaviconBadgeMock).toHaveBeenCalledWith(runStatus.Running, expect.any(Function));
  });

  it('restores title and favicon on unmount when faviconStatus was provided', () => {
    const { unmount } = renderHook(() =>
      useDocumentTitle('Pipeline | Konflux', { faviconStatus: runStatus.Succeeded }),
    );

    unmount();

    expect(document.title).toBe('Konflux');
    expect(releaseFaviconBadgeMock).toHaveBeenCalled();
  });
});
