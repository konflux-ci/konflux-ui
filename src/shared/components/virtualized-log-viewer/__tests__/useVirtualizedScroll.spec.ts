import { Virtualizer } from '@tanstack/react-virtual';
import { renderHook } from '@testing-library/react-hooks';
import { useVirtualizedScroll } from '../useVirtualizedScroll';

// Mock virtualizer
const createMockVirtualizer = (
  scrollOffset = 0,
): Partial<Virtualizer<HTMLDivElement, Element>> => ({
  scrollOffset,
  scrollToIndex: jest.fn(),
});

describe('useVirtualizedScroll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('scroll monitoring', () => {
    it('should call onScroll with initial scroll state', () => {
      const onScroll = jest.fn();
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      renderHook(() => useVirtualizedScroll({ virtualizer, onScroll }));

      expect(onScroll).toHaveBeenCalledWith({
        scrollDirection: 'forward',
        scrollOffset: 0,
        scrollUpdateWasRequested: true,
      });
    });

    it('should detect forward scroll direction', () => {
      const onScroll = jest.fn();
      let virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      const { rerender } = renderHook(() => useVirtualizedScroll({ virtualizer, onScroll }));

      onScroll.mockClear();

      // Update scroll offset to simulate forward scrolling
      virtualizer = createMockVirtualizer(100) as Virtualizer<HTMLDivElement, Element>;
      rerender();

      expect(onScroll).toHaveBeenCalledWith({
        scrollDirection: 'forward',
        scrollOffset: 100,
        scrollUpdateWasRequested: true,
      });
    });

    it('should detect backward scroll direction', () => {
      const onScroll = jest.fn();
      let virtualizer = createMockVirtualizer(100) as Virtualizer<HTMLDivElement, Element>;

      const { rerender } = renderHook(() => useVirtualizedScroll({ virtualizer, onScroll }));

      onScroll.mockClear();

      // Update scroll offset to simulate backward scrolling
      virtualizer = createMockVirtualizer(50) as Virtualizer<HTMLDivElement, Element>;
      rerender();

      expect(onScroll).toHaveBeenCalledWith({
        scrollDirection: 'backward',
        scrollOffset: 50,
        scrollUpdateWasRequested: true,
      });
    });

    it('should not call onScroll if not provided', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      // Should not throw error when onScroll is undefined
      const { result } = renderHook(() => useVirtualizedScroll({ virtualizer }));
      expect(result.error).toBeUndefined();
    });

    it('should handle undefined scrollOffset', () => {
      const onScroll = jest.fn();
      const virtualizer = { scrollToIndex: jest.fn() } as Partial<
        Virtualizer<HTMLDivElement, Element>
      > as Virtualizer<HTMLDivElement, Element>;

      renderHook(() => useVirtualizedScroll({ virtualizer, onScroll }));

      // Should default to 0 when scrollOffset is undefined
      expect(onScroll).toHaveBeenCalledWith({
        scrollDirection: 'forward',
        scrollOffset: 0,
        scrollUpdateWasRequested: true,
      });
    });
  });

  describe('scrollToRow functionality', () => {
    it('should call scrollToIndex when scrollToRow is provided', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      renderHook(() => useVirtualizedScroll({ virtualizer, scrollToRow: 5 }));

      expect(virtualizer.scrollToIndex).toHaveBeenCalledWith(4, { align: 'center' });
    });

    it('should not call scrollToIndex when scrollToRow is 0', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      renderHook(() => useVirtualizedScroll({ virtualizer, scrollToRow: 0 }));

      expect(virtualizer.scrollToIndex).not.toHaveBeenCalled();
    });

    it('should not call scrollToIndex when scrollToRow is undefined', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      renderHook(() => useVirtualizedScroll({ virtualizer, scrollToRow: undefined }));

      expect(virtualizer.scrollToIndex).not.toHaveBeenCalled();
    });

    it('should convert scrollToRow to zero-based index', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      renderHook(() => useVirtualizedScroll({ virtualizer, scrollToRow: 10 }));

      // scrollToRow 10 should become index 9
      expect(virtualizer.scrollToIndex).toHaveBeenCalledWith(9, { align: 'center' });
    });

    it('should call scrollToIndex again when scrollToRow changes', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      const { rerender } = renderHook(
        ({ scrollToRow }) => useVirtualizedScroll({ virtualizer, scrollToRow }),
        { initialProps: { scrollToRow: 5 } },
      );

      expect(virtualizer.scrollToIndex).toHaveBeenCalledWith(4, { align: 'center' });

      (virtualizer.scrollToIndex as jest.Mock).mockClear();

      rerender({ scrollToRow: 10 });

      expect(virtualizer.scrollToIndex).toHaveBeenCalledWith(9, { align: 'center' });
    });
  });

  describe('programmatic scroll detection', () => {
    it('should set scrollUpdateWasRequested to false during programmatic scroll', () => {
      const onScroll = jest.fn();

      const { rerender } = renderHook(
        ({ scrollOffset }) =>
          useVirtualizedScroll({
            virtualizer: createMockVirtualizer(scrollOffset) as Virtualizer<
              HTMLDivElement,
              Element
            >,
            scrollToRow: 5,
            onScroll,
          }),
        { initialProps: { scrollOffset: 0 } },
      );

      onScroll.mockClear();

      // Simulate scroll offset change during programmatic scroll
      rerender({ scrollOffset: 100 });

      expect(onScroll).toHaveBeenCalledWith(
        expect.objectContaining({
          scrollUpdateWasRequested: false,
        }),
      );
    });

    it('should reset scrollUpdateWasRequested after animation duration', () => {
      const onScroll = jest.fn();
      let virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      const { rerender } = renderHook(() =>
        useVirtualizedScroll({ virtualizer, scrollToRow: 5, onScroll }),
      );

      onScroll.mockClear();

      // Fast-forward past the animation duration (300ms)
      jest.advanceTimersByTime(300);

      // Simulate another scroll event after timer
      virtualizer = createMockVirtualizer(150) as Virtualizer<HTMLDivElement, Element>;
      rerender();

      expect(onScroll).toHaveBeenCalledWith(
        expect.objectContaining({
          scrollDirection: 'forward',
          scrollOffset: 150,
          scrollUpdateWasRequested: true,
        }),
      );
    });

    it('should clear timeout when scrollToRow becomes undefined', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      const { rerender, unmount } = renderHook(
        ({ scrollToRow }) => useVirtualizedScroll({ virtualizer, scrollToRow }),
        { initialProps: { scrollToRow: 5 as number | undefined } },
      );

      // Change scrollToRow to undefined
      rerender({ scrollToRow: undefined });

      // Should not throw error and timer should be cleared
      expect(() => {
        jest.advanceTimersByTime(300);
      }).not.toThrow();

      unmount();
    });

    it('should clear timeout on unmount', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      const { unmount } = renderHook(() => useVirtualizedScroll({ virtualizer, scrollToRow: 5 }));

      unmount();

      // Advancing timers should not cause issues after unmount
      expect(() => {
        jest.advanceTimersByTime(300);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle same scroll offset (no direction change)', () => {
      const onScroll = jest.fn();

      // Start with scroll offset 100
      renderHook(() =>
        useVirtualizedScroll({
          virtualizer: createMockVirtualizer(100) as Virtualizer<HTMLDivElement, Element>,
          onScroll,
        }),
      );

      // Initial call should be with scrollOffset 100, direction forward
      expect(onScroll).toHaveBeenCalledWith({
        scrollDirection: 'forward',
        scrollOffset: 100,
        scrollUpdateWasRequested: true,
      });
    });

    it('should handle rapid scrollToRow changes', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      const { rerender } = renderHook(
        ({ scrollToRow }) => useVirtualizedScroll({ virtualizer, scrollToRow }),
        { initialProps: { scrollToRow: 5 } },
      );

      rerender({ scrollToRow: 10 });
      rerender({ scrollToRow: 15 });

      // Should have been called 3 times (initial + 2 changes)
      expect(virtualizer.scrollToIndex).toHaveBeenCalledTimes(3);
      expect(virtualizer.scrollToIndex).toHaveBeenLastCalledWith(14, { align: 'center' });
    });

    it('should handle scrollToRow 1 (first row)', () => {
      const virtualizer = createMockVirtualizer(0) as Virtualizer<HTMLDivElement, Element>;

      renderHook(() => useVirtualizedScroll({ virtualizer, scrollToRow: 1 }));

      expect(virtualizer.scrollToIndex).toHaveBeenCalledWith(0, { align: 'center' });
    });
  });
});
