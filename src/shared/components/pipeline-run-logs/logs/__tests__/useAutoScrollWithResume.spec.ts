import { renderHook, act } from '@testing-library/react';
import { useAutoScrollWithResume } from '../useAutoScrollWithResume';

describe('useAutoScrollWithResume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAutoScrollWithResume());

      expect(result.current.scrollDirection).toBeNull();
      expect(result.current.autoScroll).toBe(false);
      expect(result.current.showResumeStreamButton).toBe(false);
      expect(typeof result.current.handleScroll).toBe('function');
      expect(typeof result.current.handleResumeClick).toBe('function');
    });

    it('should initialize autoScroll based on allowAutoScroll prop', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: true }));

      expect(result.current.autoScroll).toBe(true);
    });

    it('should sync autoScroll when allowAutoScroll prop changes', () => {
      const { result, rerender } = renderHook(
        ({ allowAutoScroll }) => useAutoScrollWithResume({ allowAutoScroll }),
        { initialProps: { allowAutoScroll: false } },
      );

      expect(result.current.autoScroll).toBe(false);

      // Change prop to true
      rerender({ allowAutoScroll: true });
      expect(result.current.autoScroll).toBe(true);

      // Change prop back to false
      rerender({ allowAutoScroll: false });
      expect(result.current.autoScroll).toBe(false);
    });
  });

  describe('Scroll Direction Tracking', () => {
    it('should update scroll direction to forward immediately', () => {
      const { result } = renderHook(() => useAutoScrollWithResume());

      act(() => {
        result.current.handleScroll({
          scrollDirection: 'forward',
          scrollOffset: 100,
          scrollUpdateWasRequested: false,
        });
      });

      expect(result.current.scrollDirection).toBe('forward');
    });

    it('should debounce backward scroll direction by 200ms', () => {
      const { result } = renderHook(() => useAutoScrollWithResume());

      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
      });

      // Should not update immediately
      expect(result.current.scrollDirection).toBeNull();

      // Fast forward 200ms
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Now should be updated
      expect(result.current.scrollDirection).toBe('backward');
    });

    it('should cancel backward debounce if direction changes to forward', () => {
      const { result } = renderHook(() => useAutoScrollWithResume());

      // Scroll backward
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
      });

      expect(result.current.scrollDirection).toBeNull();

      // Scroll forward before debounce completes
      act(() => {
        jest.advanceTimersByTime(100); // Only 100ms, not 200ms
        result.current.handleScroll({
          scrollDirection: 'forward',
          scrollOffset: 100,
          scrollUpdateWasRequested: false,
        });
      });

      // Should be forward immediately
      expect(result.current.scrollDirection).toBe('forward');

      // Complete the original 200ms timer
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should still be forward (backward was cancelled)
      expect(result.current.scrollDirection).toBe('forward');
    });

    it('should handle rapid backward scrolls with debouncing', () => {
      const { result } = renderHook(() => useAutoScrollWithResume());

      // Multiple rapid backward scrolls
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
        jest.advanceTimersByTime(50);

        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 40,
          scrollUpdateWasRequested: false,
        });
        jest.advanceTimersByTime(50);

        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 30,
          scrollUpdateWasRequested: false,
        });
      });

      // Should still be null (timer keeps resetting)
      expect(result.current.scrollDirection).toBeNull();

      // Wait full 200ms after last scroll
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.scrollDirection).toBe('backward');
    });
  });

  describe('Auto-scroll State', () => {
    it('should disable auto-scroll when user manually scrolls (scrollUpdateWasRequested=true)', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: true }));

      expect(result.current.autoScroll).toBe(true);

      act(() => {
        result.current.handleScroll({
          scrollDirection: 'forward',
          scrollOffset: 100,
          scrollUpdateWasRequested: true, // User scroll
        });
      });

      expect(result.current.autoScroll).toBe(false);
    });

    it('should NOT disable auto-scroll on programmatic scroll (scrollUpdateWasRequested=false)', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: true }));

      expect(result.current.autoScroll).toBe(true);

      act(() => {
        result.current.handleScroll({
          scrollDirection: 'forward',
          scrollOffset: 100,
          scrollUpdateWasRequested: false, // Programmatic scroll
        });
      });

      expect(result.current.autoScroll).toBe(true);
    });
  });

  describe('Resume Stream Button', () => {
    it('should show resume button when allowAutoScroll=true and scrolling backward', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: true }));

      expect(result.current.showResumeStreamButton).toBe(false);

      // Scroll backward
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
        jest.advanceTimersByTime(200); // Wait for debounce
      });

      expect(result.current.showResumeStreamButton).toBe(true);
    });

    it('should NOT show resume button when allowAutoScroll=false', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: false }));

      // Scroll backward
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
        jest.advanceTimersByTime(200); // Wait for debounce
      });

      expect(result.current.showResumeStreamButton).toBe(false);
    });

    it('should hide resume button when scrolling forward', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: true }));

      // Scroll backward first
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
        jest.advanceTimersByTime(200);
      });

      expect(result.current.showResumeStreamButton).toBe(true);

      // Now scroll forward
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'forward',
          scrollOffset: 100,
          scrollUpdateWasRequested: false,
        });
      });

      expect(result.current.showResumeStreamButton).toBe(false);
    });
  });

  describe('Resume Button Click', () => {
    it('should re-enable auto-scroll when resume button is clicked', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: true }));

      // Disable auto-scroll by user scrolling
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: true,
        });
        jest.advanceTimersByTime(200);
      });

      expect(result.current.autoScroll).toBe(false);
      expect(result.current.showResumeStreamButton).toBe(true);

      // Click resume
      act(() => {
        result.current.handleResumeClick();
      });

      expect(result.current.autoScroll).toBe(true);
      expect(result.current.scrollDirection).toBe('forward');
      expect(result.current.showResumeStreamButton).toBe(false);
    });

    it('should set scroll direction to forward when resume is clicked', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: true }));

      // Scroll backward
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
        jest.advanceTimersByTime(200);
      });

      expect(result.current.scrollDirection).toBe('backward');

      // Click resume
      act(() => {
        result.current.handleResumeClick();
      });

      expect(result.current.scrollDirection).toBe('forward');
    });
  });

  describe('onScroll Callback', () => {
    it('should call onScroll callback when provided', () => {
      const onScroll = jest.fn();
      const { result } = renderHook(() => useAutoScrollWithResume({ onScroll }));

      const scrollProps = {
        scrollDirection: 'forward' as const,
        scrollOffset: 100,
        scrollUpdateWasRequested: false,
      };

      act(() => {
        result.current.handleScroll(scrollProps);
      });

      expect(onScroll).toHaveBeenCalledWith(scrollProps);
      expect(onScroll).toHaveBeenCalledTimes(1);
    });
    it('should not throw when onScroll is undefined', () => {
      const { result } = renderHook(() => useAutoScrollWithResume());

      const triggerScroll = () => {
        result.current.handleScroll({
          scrollDirection: 'forward',
          scrollOffset: 100,
          scrollUpdateWasRequested: false,
        });
      };

      expect(() => {
        act(triggerScroll);
      }).not.toThrow();
    });

    it('should call onScroll with updated props on each scroll', () => {
      const onScroll = jest.fn();
      const { result } = renderHook(() => useAutoScrollWithResume({ onScroll }));

      act(() => {
        result.current.handleScroll({
          scrollDirection: 'forward',
          scrollOffset: 100,
          scrollUpdateWasRequested: false,
        });
      });

      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: true,
        });
      });

      expect(onScroll).toHaveBeenCalledTimes(2);
      expect(onScroll).toHaveBeenNthCalledWith(1, {
        scrollDirection: 'forward',
        scrollOffset: 100,
        scrollUpdateWasRequested: false,
      });
      expect(onScroll).toHaveBeenNthCalledWith(2, {
        scrollDirection: 'backward',
        scrollOffset: 50,
        scrollUpdateWasRequested: true,
      });
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useAutoScrollWithResume());

      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
      });

      unmount();

      const advanceTimers = () => {
        jest.advanceTimersByTime(200);
      };

      expect(() => {
        act(advanceTimers);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle allowAutoScroll changing while scroll direction is backward', () => {
      const { result, rerender } = renderHook(
        ({ allowAutoScroll }) => useAutoScrollWithResume({ allowAutoScroll }),
        { initialProps: { allowAutoScroll: true } },
      );

      // Scroll backward
      act(() => {
        result.current.handleScroll({
          scrollDirection: 'backward',
          scrollOffset: 50,
          scrollUpdateWasRequested: false,
        });
        jest.advanceTimersByTime(200);
      });

      expect(result.current.showResumeStreamButton).toBe(true);

      // Change allowAutoScroll to false
      rerender({ allowAutoScroll: false });

      expect(result.current.showResumeStreamButton).toBe(false);
    });

    it('should handle rapid resume clicks gracefully', () => {
      const { result } = renderHook(() => useAutoScrollWithResume({ allowAutoScroll: true }));

      const clickResumeRapidly = () => {
        result.current.handleResumeClick();
        result.current.handleResumeClick();
        result.current.handleResumeClick();
      };

      expect(() => {
        act(clickResumeRapidly);
      }).not.toThrow();

      expect(result.current.autoScroll).toBe(true);
      expect(result.current.scrollDirection).toBe('forward');
    });
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useAutoScrollWithResume());

      const initialHandleScroll = result.current.handleScroll;
      const initialHandleResumeClick = result.current.handleResumeClick;

      // Trigger re-render
      rerender();

      // Function references should be stable
      expect(result.current.handleScroll).toBe(initialHandleScroll);
      expect(result.current.handleResumeClick).toBe(initialHandleResumeClick);
    });
  });
});
