import { renderHook, act } from '@testing-library/react';
import { useLineNumberNavigation } from '../useLineNumberNavigation';

// Helper function to create mock mouse event with shiftKey property
const createMouseEvent = (shiftKey: boolean): React.MouseEvent => {
  const event = new MouseEvent('click') as unknown as React.MouseEvent;
  Object.defineProperty(event, 'shiftKey', { value: shiftKey, writable: false });
  return event;
};

describe('useLineNumberNavigation', () => {
  let originalHash: string;
  let pushStateSpy: jest.SpyInstance;

  beforeEach(() => {
    // Save and reset hash
    originalHash = window.location.hash;
    window.location.hash = '';

    // Reset history.state using replaceState
    window.history.replaceState(null, '');

    // Mock pushState using spyOn - preserve state parameter for internal navigation tracking
    pushStateSpy = jest
      .spyOn(window.history, 'pushState')
      .mockImplementation((state, title, url) => {
        // Actually update hash and state in test environment using replaceState
        const newUrl = url && typeof url === 'string' && url.includes('#') ? url : '#';
        window.history.replaceState(state, title || '', newUrl);
        if (url && typeof url === 'string' && url.includes('#')) {
          window.location.hash = url.split('#')[1];
        }
      });
  });

  afterEach(() => {
    // Restore hash
    window.location.hash = originalHash;

    // Reset history.state using replaceState
    window.history.replaceState(null, '');

    // Restore pushState
    pushStateSpy.mockRestore();
  });

  describe('Initial State', () => {
    it('should initialize with no highlighted lines when no hash', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.highlightedLines).toBeNull();
      expect(result.current.firstSelectedLine).toBeNull();
    });

    it('should parse single line from hash on mount (#L123)', () => {
      window.location.hash = '#L123';
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.highlightedLines).toEqual({ start: 123, end: 123 });
    });

    it('should parse line range from hash on mount (#L10-L20)', () => {
      window.location.hash = '#L10-L20';
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.highlightedLines).toEqual({ start: 10, end: 20 });
    });

    it('should handle reversed range and normalize it (#L20-L10)', () => {
      window.location.hash = '#L20-L10';
      const { result } = renderHook(() => useLineNumberNavigation());

      // Should normalize to ascending order
      expect(result.current.highlightedLines).toEqual({ start: 10, end: 20 });
    });

    it('should ignore invalid hash formats', () => {
      window.location.hash = '#invalid';
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.highlightedLines).toBeNull();
    });
  });

  describe('Single Line Selection', () => {
    it('should select single line on click', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      act(() => {
        result.current.handleLineClick(42, createMouseEvent(false));
      });

      expect(pushStateSpy).toHaveBeenCalledWith({ source: 'line-click' }, '', '#L42');
      expect(result.current.highlightedLines).toEqual({ start: 42, end: 42 });
      expect(result.current.firstSelectedLine).toBe(42);
    });

    it('should update firstSelectedLine for range selection', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      act(() => {
        result.current.handleLineClick(10, createMouseEvent(false));
      });

      expect(result.current.firstSelectedLine).toBe(10);
    });
  });

  describe('Range Selection with Shift-Click', () => {
    it('should create range with shift-click', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      // First click to set anchor
      act(() => {
        result.current.handleLineClick(10, createMouseEvent(false));
      });

      // Shift-click to create range
      act(() => {
        result.current.handleLineClick(20, createMouseEvent(true));
      });

      expect(pushStateSpy).toHaveBeenLastCalledWith({ source: 'line-click' }, '', '#L10-L20');
      expect(result.current.highlightedLines).toEqual({ start: 10, end: 20 });
      expect(result.current.firstSelectedLine).toBeNull(); // Reset after range
    });

    it('should handle reversed shift-click range', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      // First click at line 20
      act(() => {
        result.current.handleLineClick(20, createMouseEvent(false));
      });

      // Shift-click at line 10 (earlier)
      act(() => {
        result.current.handleLineClick(10, createMouseEvent(true));
      });

      // Should normalize to ascending order
      expect(pushStateSpy).toHaveBeenLastCalledWith({ source: 'line-click' }, '', '#L10-L20');
      expect(result.current.highlightedLines).toEqual({ start: 10, end: 20 });
    });

    it('should ignore shift-click without first selection', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      act(() => {
        result.current.handleLineClick(20, createMouseEvent(true));
      });

      // Should treat as single selection
      expect(pushStateSpy).toHaveBeenCalledWith({ source: 'line-click' }, '', '#L20');
      expect(result.current.highlightedLines).toEqual({ start: 20, end: 20 });
    });

    it('should reset firstSelectedLine after creating range', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      act(() => {
        result.current.handleLineClick(10, createMouseEvent(false));
      });

      expect(result.current.firstSelectedLine).toBe(10);

      act(() => {
        result.current.handleLineClick(20, createMouseEvent(true));
      });

      expect(result.current.firstSelectedLine).toBeNull();
    });
  });

  describe('isLineHighlighted', () => {
    it('should return false when no lines highlighted', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.isLineHighlighted(10)).toBe(false);
    });

    it('should return true for highlighted single line', () => {
      window.location.hash = '#L42';
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.isLineHighlighted(42)).toBe(true);
      expect(result.current.isLineHighlighted(41)).toBe(false);
      expect(result.current.isLineHighlighted(43)).toBe(false);
    });

    it('should return true for lines in highlighted range', () => {
      window.location.hash = '#L10-L20';
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.isLineHighlighted(9)).toBe(false);
      expect(result.current.isLineHighlighted(10)).toBe(true);
      expect(result.current.isLineHighlighted(15)).toBe(true);
      expect(result.current.isLineHighlighted(20)).toBe(true);
      expect(result.current.isLineHighlighted(21)).toBe(false);
    });
  });

  describe('Hash Change Event', () => {
    it('should update highlighted lines when hash changes', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.highlightedLines).toBeNull();

      // Simulate hash change
      act(() => {
        window.location.hash = '#L123';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(result.current.highlightedLines).toEqual({ start: 123, end: 123 });
    });

    it('should reset firstSelectedLine on hash change', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      // Set first selected line
      act(() => {
        result.current.handleLineClick(10, createMouseEvent(false));
      });

      expect(result.current.firstSelectedLine).toBe(10);

      // External hash change (without line-click state) should reset it
      act(() => {
        window.location.hash = '#L456';
        window.history.replaceState(null, '', '#L456'); // No line-click state
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(result.current.firstSelectedLine).toBeNull();
    });

    it('should clear highlights when hash is removed', () => {
      window.location.hash = '#L123';
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.highlightedLines).toEqual({ start: 123, end: 123 });

      act(() => {
        window.location.hash = '';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(result.current.highlightedLines).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle line number 1', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      act(() => {
        result.current.handleLineClick(1, createMouseEvent(false));
      });

      expect(result.current.highlightedLines).toEqual({ start: 1, end: 1 });
    });

    it('should handle very large line numbers', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      act(() => {
        result.current.handleLineClick(999999, createMouseEvent(false));
      });

      expect(result.current.highlightedLines).toEqual({ start: 999999, end: 999999 });
    });

    it('should handle single-line range (same start and end)', () => {
      window.location.hash = '#L42-L42';
      const { result } = renderHook(() => useLineNumberNavigation());

      expect(result.current.highlightedLines).toEqual({ start: 42, end: 42 });
      expect(result.current.isLineHighlighted(42)).toBe(true);
      expect(result.current.isLineHighlighted(43)).toBe(false);
    });
  });

  describe('Hash clearing when switching views', () => {
    it('should clear highlighted lines when hash is removed without hashchange event', () => {
      // Start with a hash
      window.location.hash = '#L9-L14';
      const { result, rerender } = renderHook(() => useLineNumberNavigation());

      // Verify initial highlight
      expect(result.current.highlightedLines).toEqual({ start: 9, end: 14 });
      expect(result.current.isLineHighlighted(10)).toBe(true);

      // Simulate switching to another log view where parent clears the hash directly
      // (without triggering hashchange event)
      window.location.hash = '';
      window.history.replaceState(null, '', window.location.pathname);

      // Force re-render to trigger useEffect
      rerender();

      // Highlighted lines should be cleared
      expect(result.current.highlightedLines).toBeNull();
      expect(result.current.isLineHighlighted(10)).toBe(false);
    });

    it('should update highlights when hash changes without hashchange event', () => {
      // Start with a hash
      window.location.hash = '#L5';
      const { result, rerender } = renderHook(() => useLineNumberNavigation());

      expect(result.current.highlightedLines).toEqual({ start: 5, end: 5 });

      // Simulate parent changing the hash directly (update both hash and state)
      window.location.hash = '#L20-L25';
      window.history.replaceState(null, '', '#L20-L25');

      // Force re-render to trigger useEffect
      rerender();

      // Should update to new highlight
      expect(result.current.highlightedLines).toEqual({ start: 20, end: 25 });
      expect(result.current.isLineHighlighted(22)).toBe(true);
      expect(result.current.isLineHighlighted(5)).toBe(false);
    });

    it('should not re-render infinitely when hash does not change', () => {
      window.location.hash = '#L10';
      const { result, rerender } = renderHook(() => useLineNumberNavigation());

      const initialHighlight = result.current.highlightedLines;
      expect(initialHighlight).toEqual({ start: 10, end: 10 });

      // Multiple re-renders without hash change
      rerender();
      rerender();
      rerender();

      // Should maintain the same reference (no unnecessary re-renders)
      expect(result.current.highlightedLines).toEqual({ start: 10, end: 10 });
    });

    it('should preserve firstSelectedLine after single line click for shift-click range selection', () => {
      window.location.hash = '';
      const { result, rerender } = renderHook(() => useLineNumberNavigation());

      // Click line 5 (without shift)
      act(() => {
        result.current.handleLineClick(5, createMouseEvent(false));
      });

      // After clicking, hash should be #L5 and firstSelectedLine should be 5
      expect(window.location.hash).toBe('#L5');
      expect(result.current.firstSelectedLine).toBe(5);
      // Verify history.state was set to mark internal navigation
      expect(window.history.state).toEqual({ source: 'line-click' });

      // Simulate re-render (hash sync effect runs)
      rerender();

      // firstSelectedLine should STILL be 5 (not cleared by hash sync for internal clicks)
      expect(result.current.firstSelectedLine).toBe(5);

      // Now shift-click line 10 to create a range
      act(() => {
        result.current.handleLineClick(10, createMouseEvent(true));
      });

      // Should create range L5-L10
      expect(window.location.hash).toBe('#L5-L10');
      expect(result.current.highlightedLines).toEqual({ start: 5, end: 10 });
      expect(result.current.isLineHighlighted(7)).toBe(true);
      // Verify history.state was set for range selection too
      expect(window.history.state).toEqual({ source: 'line-click' });
    });
  });

  describe('Performance', () => {
    it('should not cause excessive re-renders when hash does not change', () => {
      window.location.hash = '#L10';
      const { result, rerender } = renderHook(() => useLineNumberNavigation());

      const initialHighlight = result.current.highlightedLines;
      const initialIsHighlighted = result.current.isLineHighlighted;
      const initialHandleClick = result.current.handleLineClick;

      // Multiple re-renders without hash change
      for (let i = 0; i < 10; i++) {
        rerender();
      }

      // Function references should remain stable
      expect(result.current.isLineHighlighted).toBe(initialIsHighlighted);
      expect(result.current.handleLineClick).toBe(initialHandleClick);

      // Highlighted lines should be the same (though may be a new object)
      expect(result.current.highlightedLines).toEqual(initialHighlight);
    });

    it('should efficiently handle rapid hash changes', () => {
      const { result } = renderHook(() => useLineNumberNavigation());

      // Simulate rapid clicking
      const start = performance.now();
      act(() => {
        for (let i = 1; i <= 100; i++) {
          result.current.handleLineClick(i, createMouseEvent(false));
        }
      });
      const duration = performance.now() - start;

      // Should complete 100 clicks in reasonable time (< 100ms in test environment)
      expect(duration).toBeLessThan(100);

      // Final state should be correct
      expect(result.current.highlightedLines).toEqual({ start: 100, end: 100 });
      expect(result.current.firstSelectedLine).toBe(100);
    });

    it('should not re-parse hash on every render when unchanged', () => {
      window.location.hash = '#L50-L60';

      // Verify the state doesn't change unnecessarily
      const { result, rerender } = renderHook(() => useLineNumberNavigation());

      const initialHighlight = result.current.highlightedLines;

      // Re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender();
        // Highlighted lines object should be the same
        expect(result.current.highlightedLines).toEqual(initialHighlight);
      }
    });
  });
});
