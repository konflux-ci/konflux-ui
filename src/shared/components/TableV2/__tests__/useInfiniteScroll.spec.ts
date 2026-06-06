import { renderHook } from '@testing-library/react';
import { useInfiniteScroll } from '~/shared/components/TableV2/hooks/useInfiniteScroll';

function createMockScrollElement(
  overrides?: Partial<{
    scrollTop: number;
    clientHeight: number;
    scrollHeight: number;
  }>,
): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperties(el, {
    scrollTop: { value: overrides?.scrollTop ?? 0, configurable: true, writable: true },
    clientHeight: { value: overrides?.clientHeight ?? 600, configurable: true },
    scrollHeight: { value: overrides?.scrollHeight ?? 1200, configurable: true },
  });
  return el;
}

describe('useInfiniteScroll', () => {
  it('triggers fetch when scrolled near bottom and last item is within threshold', () => {
    const fetchNextPage = jest.fn();
    // scrollTop(900) + clientHeight(600) = 1500 >= scrollHeight(1200) - 200 = 1000
    const scrollElement = createMockScrollElement({
      scrollTop: 900,
      clientHeight: 600,
      scrollHeight: 1200,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
      }),
    );

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger when no scrollbar (content fits without scrolling)', () => {
    const fetchNextPage = jest.fn();
    // scrollHeight(600) <= clientHeight(600) => no overflow
    const scrollElement = createMockScrollElement({
      scrollTop: 0,
      clientHeight: 600,
      scrollHeight: 600,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does NOT trigger when not scrolled near bottom', () => {
    const fetchNextPage = jest.fn();
    // scrollTop(0) + clientHeight(600) = 600 < scrollHeight(1200) - 200 = 1000
    const scrollElement = createMockScrollElement({
      scrollTop: 0,
      clientHeight: 600,
      scrollHeight: 1200,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does NOT trigger when already fetching', () => {
    const fetchNextPage = jest.fn();
    const scrollElement = createMockScrollElement({
      scrollTop: 900,
      clientHeight: 600,
      scrollHeight: 1200,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage,
        scrollElement,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does NOT trigger when no next page', () => {
    const fetchNextPage = jest.fn();
    const scrollElement = createMockScrollElement({
      scrollTop: 900,
      clientHeight: 600,
      scrollHeight: 1200,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does NOT trigger when scrollElement is null', () => {
    const fetchNextPage = jest.fn();

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement: null,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does NOT trigger when well above threshold', () => {
    const fetchNextPage = jest.fn();
    const scrollElement = createMockScrollElement({
      scrollTop: 900,
      clientHeight: 600,
      scrollHeight: 1200,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 50 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('handles empty virtual items without crashing', () => {
    const fetchNextPage = jest.fn();
    const scrollElement = createMockScrollElement({
      scrollTop: 900,
      clientHeight: 600,
      scrollHeight: 1200,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('supports custom threshold', () => {
    const fetchNextPage = jest.fn();
    const scrollElement = createMockScrollElement({
      scrollTop: 900,
      clientHeight: 600,
      scrollHeight: 1200,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
        threshold: 3,
      }),
    );

    // 96 < 100 - 3 = 97, so should NOT trigger with threshold=3
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('triggers fetch on scroll event when scrolled near bottom', () => {
    const fetchNextPage = jest.fn();
    // Start NOT near bottom
    const scrollElement = createMockScrollElement({
      scrollTop: 0,
      clientHeight: 600,
      scrollHeight: 1200,
    });

    renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
      }),
    );

    // Not triggered initially (not near bottom)
    expect(fetchNextPage).not.toHaveBeenCalled();

    // Simulate scrolling near the bottom
    Object.defineProperty(scrollElement, 'scrollTop', { value: 900, configurable: true });
    scrollElement.dispatchEvent(new Event('scroll'));

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('removes scroll event listener on cleanup', () => {
    const fetchNextPage = jest.fn();
    const scrollElement = createMockScrollElement({
      scrollTop: 0,
      clientHeight: 600,
      scrollHeight: 1200,
    });
    const removeSpy = jest.spyOn(scrollElement, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useInfiniteScroll({
        virtualRows: [{ index: 96 }],
        totalCount: 100,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        scrollElement,
      }),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
