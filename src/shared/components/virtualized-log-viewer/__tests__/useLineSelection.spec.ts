import { renderHook, act } from '@testing-library/react-hooks';
import { useLineSelection } from '../useLineSelection';

describe('useLineSelection', () => {
  let originalLocation: Location;

  beforeEach(() => {
    // Save original location
    originalLocation = window.location;
    // Mock window.location
    delete (window as unknown as { location: Location }).location;
    window.location = {
      ...originalLocation,
      hash: '',
    } as Location;
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  describe('hash parsing', () => {
    it('should parse single line hash #L10', () => {
      window.location.hash = '#L10';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toEqual({ start: 10, end: 10 });
      expect(result.current.shouldScrollToSelection).toBe(true);
    });

    it('should parse line range hash #L5-L15', () => {
      window.location.hash = '#L5-L15';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toEqual({ start: 5, end: 15 });
      expect(result.current.shouldScrollToSelection).toBe(true);
    });

    it('should parse reverse range hash #L20-L10', () => {
      window.location.hash = '#L20-L10';

      const { result } = renderHook(() => useLineSelection());

      // Should normalize to start < end
      expect(result.current.selectedLines).toEqual({ start: 10, end: 20 });
      expect(result.current.shouldScrollToSelection).toBe(true);
    });

    it('should return null for invalid hash', () => {
      window.location.hash = '#invalid';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toBeNull();
      expect(result.current.shouldScrollToSelection).toBe(false);
    });

    it('should return null for empty hash', () => {
      window.location.hash = '';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toBeNull();
      expect(result.current.shouldScrollToSelection).toBe(false);
    });

    it('should parse malformed range hash #L-L15', () => {
      window.location.hash = '#L-L15';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toBeNull();
      expect(result.current.shouldScrollToSelection).toBe(false);
    });
  });

  describe('hash change events', () => {
    it('should update selection when hash changes', () => {
      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toBeNull();

      act(() => {
        window.location.hash = '#L42';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(result.current.selectedLines).toEqual({ start: 42, end: 42 });
      expect(result.current.shouldScrollToSelection).toBe(true);
    });

    it('should clear selection when hash is removed', () => {
      window.location.hash = '#L10';
      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toEqual({ start: 10, end: 10 });

      act(() => {
        window.location.hash = '';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(result.current.selectedLines).toBeNull();
      expect(result.current.shouldScrollToSelection).toBe(false);
    });
  });

  describe('handleLineClick', () => {
    it('should select single line on click', () => {
      const { result } = renderHook(() => useLineSelection());

      act(() => {
        result.current.handleLineClick(25, false);
      });

      expect(result.current.selectedLines).toEqual({ start: 25, end: 25 });
      expect(window.location.hash).toBe('#L25');
    });

    it('should create range selection with shift+click', () => {
      const { result } = renderHook(() => useLineSelection());

      // First click
      act(() => {
        result.current.handleLineClick(10, false);
      });

      expect(result.current.selectedLines).toEqual({ start: 10, end: 10 });

      // Shift+click
      act(() => {
        result.current.handleLineClick(20, true);
      });

      expect(result.current.selectedLines).toEqual({ start: 10, end: 20 });
      expect(window.location.hash).toBe('#L10-L20');
    });

    it('should create reverse range with shift+click', () => {
      const { result } = renderHook(() => useLineSelection());

      // First click
      act(() => {
        result.current.handleLineClick(50, false);
      });

      // Shift+click on earlier line
      act(() => {
        result.current.handleLineClick(30, true);
      });

      expect(result.current.selectedLines).toEqual({ start: 30, end: 50 });
      expect(window.location.hash).toBe('#L30-L50');
    });

    it('should not create range if shift+click without previous click', () => {
      const { result } = renderHook(() => useLineSelection());

      act(() => {
        result.current.handleLineClick(15, true);
      });

      // Should treat as single line selection
      expect(result.current.selectedLines).toEqual({ start: 15, end: 15 });
      expect(window.location.hash).toBe('#L15');
    });

    it('should not scroll when clicking line numbers', () => {
      const { result } = renderHook(() => useLineSelection());

      act(() => {
        result.current.handleLineClick(10, false);
      });

      // User clicks should not trigger scroll
      expect(result.current.shouldScrollToSelection).toBe(false);
    });
  });

  describe('resetScrollFlag', () => {
    it('should reset scroll flag when called', () => {
      window.location.hash = '#L10';
      const { result } = renderHook(() => useLineSelection());

      expect(result.current.shouldScrollToSelection).toBe(true);

      act(() => {
        result.current.resetScrollFlag();
      });

      expect(result.current.shouldScrollToSelection).toBe(false);
      // Selection should remain
      expect(result.current.selectedLines).toEqual({ start: 10, end: 10 });
    });
  });

  describe('edge cases', () => {
    it('should handle line number 1', () => {
      window.location.hash = '#L1';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toEqual({ start: 1, end: 1 });
    });

    it('should handle very large line numbers', () => {
      window.location.hash = '#L999999';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toEqual({ start: 999999, end: 999999 });
    });

    it('should handle same start and end in range', () => {
      window.location.hash = '#L42-L42';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toEqual({ start: 42, end: 42 });
    });

    it('should ignore hash with non-numeric line numbers', () => {
      window.location.hash = '#Labc';

      const { result } = renderHook(() => useLineSelection());

      expect(result.current.selectedLines).toBeNull();
    });

    it('should preserve lastClickedLine from first click for subsequent shift+clicks', () => {
      const { result } = renderHook(() => useLineSelection());

      // User clicks L10
      act(() => {
        result.current.handleLineClick(10, false);
      });

      // User manually changes URL to #L5-L15 (e.g., shares link)
      act(() => {
        window.location.hash = '#L5-L15';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      // Shift+click should still create range based on last clicked line (L10)
      // This preserves user workflow when they manually adjust URL but continue selecting
      act(() => {
        result.current.handleLineClick(20, true);
      });

      expect(result.current.selectedLines).toEqual({ start: 10, end: 20 });
    });
  });
});
