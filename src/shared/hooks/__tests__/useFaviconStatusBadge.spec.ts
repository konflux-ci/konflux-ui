import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_success_color_100 as greenColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { renderHook } from '@testing-library/react';
import * as faviconBadge from '~/shared/utils/favicon-badge';
import { useFaviconStatusBadge } from '../useFaviconStatusBadge';

jest.mock('~/shared/utils/favicon-badge', () => ({
  applyFaviconBadge: jest.fn().mockResolvedValue(undefined),
  acquireFaviconBadge: jest.fn(),
  releaseFaviconBadge: jest.fn(),
}));

const applyFaviconBadgeMock = faviconBadge.applyFaviconBadge as jest.Mock;
const acquireFaviconBadgeMock = faviconBadge.acquireFaviconBadge as jest.Mock;
const releaseFaviconBadgeMock = faviconBadge.releaseFaviconBadge as jest.Mock;

describe('useFaviconStatusBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies favicon badge when color is provided', () => {
    renderHook(() => useFaviconStatusBadge(blueColor.value));

    expect(acquireFaviconBadgeMock).toHaveBeenCalled();
    expect(applyFaviconBadgeMock).toHaveBeenCalledWith(blueColor.value, expect.any(Function));
  });

  it('applies favicon badge when color changes', () => {
    const { rerender } = renderHook(
      ({ color }: { color: string }) => useFaviconStatusBadge(color),
      {
        initialProps: { color: blueColor.value },
      },
    );

    rerender({ color: greenColor.value });

    expect(applyFaviconBadgeMock).toHaveBeenCalledTimes(2);
    expect(applyFaviconBadgeMock).toHaveBeenLastCalledWith(greenColor.value, expect.any(Function));
  });

  it('restores favicon on unmount', () => {
    const { unmount } = renderHook(() => useFaviconStatusBadge(blueColor.value));

    unmount();

    expect(releaseFaviconBadgeMock).toHaveBeenCalled();
  });

  it('passes a cancellation callback that applyFaviconBadge can use', () => {
    let isCancelled: (() => boolean) | undefined;
    applyFaviconBadgeMock.mockImplementation((_color, cancelled) => {
      isCancelled = cancelled;
      return Promise.resolve();
    });

    const { unmount } = renderHook(() => useFaviconStatusBadge(blueColor.value));

    expect(isCancelled?.()).toBe(false);
    unmount();
    expect(isCancelled?.()).toBe(true);
  });
});
