import { renderHook } from '@testing-library/react';
import { useInfiniteScroll } from '~/shared/components/TableV2/hooks/useInfiniteScroll';

const createMockVirtualizer = (overrides: { lastIndex?: number; count?: number } = {}) => ({
  getVirtualItems: jest
    .fn()
    .mockReturnValue(overrides.lastIndex !== undefined ? [{ index: overrides.lastIndex }] : []),
  options: { count: overrides.count ?? 100 },
});

describe('useInfiniteScroll', () => {
  it('triggers fetch when last item is within threshold of total count', () => {
    const fetchNextPage = jest.fn();
    const virtualizer = createMockVirtualizer({ lastIndex: 96, count: 100 });

    renderHook(() =>
      useInfiniteScroll({
        virtualizer,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
      }),
    );

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger when already fetching', () => {
    const fetchNextPage = jest.fn();
    const virtualizer = createMockVirtualizer({ lastIndex: 96, count: 100 });

    renderHook(() =>
      useInfiniteScroll({
        virtualizer,
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does NOT trigger when no next page', () => {
    const fetchNextPage = jest.fn();
    const virtualizer = createMockVirtualizer({ lastIndex: 96, count: 100 });

    renderHook(() =>
      useInfiniteScroll({
        virtualizer,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('does NOT trigger when well above threshold', () => {
    const fetchNextPage = jest.fn();
    const virtualizer = createMockVirtualizer({ lastIndex: 50, count: 100 });

    renderHook(() =>
      useInfiniteScroll({
        virtualizer,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('handles empty virtual items without crashing', () => {
    const fetchNextPage = jest.fn();
    const virtualizer = createMockVirtualizer({ count: 100 });

    renderHook(() =>
      useInfiniteScroll({
        virtualizer,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('supports custom threshold', () => {
    const fetchNextPage = jest.fn();
    const virtualizer = createMockVirtualizer({ lastIndex: 96, count: 100 });

    renderHook(() =>
      useInfiniteScroll({
        virtualizer,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        threshold: 3,
      }),
    );

    // 96 < 100 - 3 = 97, so should NOT trigger with threshold=3
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
