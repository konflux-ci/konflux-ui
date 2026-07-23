import { t_global_icon_color_status_info_default as blueColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_info_default';
import { t_global_icon_color_status_success_default as greenColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { renderHook } from '@testing-library/react';
import * as faviconBadge from '~/shared/utils/favicon-badge';
import { useFaviconStatusBadge } from '../useFaviconStatusBadge';

jest.mock('~/shared/utils/favicon-badge', () => ({
  applyFaviconBadge: jest.fn().mockResolvedValue(undefined),
  getFaviconBaselineHref: jest.fn().mockReturnValue('/favicon.ico'),
  restoreFaviconHref: jest.fn(),
}));

const applyFaviconBadgeMock = faviconBadge.applyFaviconBadge as jest.Mock;
const getFaviconBaselineHrefMock = faviconBadge.getFaviconBaselineHref as jest.Mock;
const restoreFaviconHrefMock = faviconBadge.restoreFaviconHref as jest.Mock;

describe('useFaviconStatusBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getFaviconBaselineHrefMock.mockReturnValue('/favicon.ico');
  });

  it('does not apply favicon badge and restores favicon when color is null', () => {
    renderHook(() => useFaviconStatusBadge(null));

    expect(applyFaviconBadgeMock).not.toHaveBeenCalled();
    expect(restoreFaviconHrefMock).toHaveBeenCalledWith('/favicon.ico');
  });

  it('applies favicon badge when color is provided', () => {
    renderHook(() => useFaviconStatusBadge(blueColor.value));

    expect(getFaviconBaselineHrefMock).toHaveBeenCalled();
    expect(applyFaviconBadgeMock).toHaveBeenCalledWith(
      blueColor.value,
      '/favicon.ico',
      expect.any(Function),
    );
  });

  it('applies favicon badge when color changes', () => {
    const { rerender } = renderHook(
      ({ color }: { color: string }) => useFaviconStatusBadge(color),
      {
        initialProps: { color: blueColor.value },
      },
    );

    rerender({ color: greenColor.value });

    expect(getFaviconBaselineHrefMock).toHaveBeenCalledTimes(1);
    expect(restoreFaviconHrefMock).not.toHaveBeenCalled();
    expect(applyFaviconBadgeMock).toHaveBeenCalledTimes(2);
    expect(applyFaviconBadgeMock).toHaveBeenLastCalledWith(
      greenColor.value,
      '/favicon.ico',
      expect.any(Function),
    );
  });

  it('restores favicon when color changes to null', () => {
    const { rerender } = renderHook(
      ({ color }: { color: string | null }) => useFaviconStatusBadge(color),
      {
        initialProps: { color: blueColor.value as string | null },
      },
    );

    expect(applyFaviconBadgeMock).toHaveBeenCalledTimes(1);
    restoreFaviconHrefMock.mockClear();

    rerender({ color: null });

    expect(applyFaviconBadgeMock).toHaveBeenCalledTimes(1);
    expect(restoreFaviconHrefMock).toHaveBeenCalledWith('/favicon.ico');
  });

  it('restores favicon on unmount', () => {
    const { unmount } = renderHook(() => useFaviconStatusBadge(blueColor.value));

    unmount();

    expect(restoreFaviconHrefMock).toHaveBeenCalledWith('/favicon.ico');
  });

  it('restores the original favicon after navigating between status pages', () => {
    // First page captured a real baseline; second page mounts while a data: badge is still set.
    getFaviconBaselineHrefMock
      .mockReturnValueOnce('/favicon.ico')
      .mockReturnValueOnce('/favicon.ico');

    const firstPage = renderHook(() => useFaviconStatusBadge(blueColor.value));
    const secondPage = renderHook(() => useFaviconStatusBadge(greenColor.value));

    firstPage.unmount();
    restoreFaviconHrefMock.mockClear();
    secondPage.unmount();

    expect(restoreFaviconHrefMock).toHaveBeenCalledWith('/favicon.ico');
    expect(restoreFaviconHrefMock).not.toHaveBeenCalledWith(expect.stringMatching(/^data:/));
  });

  it('passes a cancellation callback that applyFaviconBadge can use', () => {
    let isCancelled: (() => boolean) | undefined;
    applyFaviconBadgeMock.mockImplementation((_color, _baseHref, cancelled) => {
      isCancelled = cancelled;
      return Promise.resolve();
    });

    const { unmount } = renderHook(() => useFaviconStatusBadge(blueColor.value));

    expect(isCancelled?.()).toBe(false);
    unmount();
    expect(isCancelled?.()).toBe(true);
  });
});
