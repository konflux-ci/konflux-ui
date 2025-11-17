import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useLogLineNavigation } from '../useLogLineNavigation';

/**
 * Note: Line number click interactions are tested manually in browser
 * as they rely on event delegation which is difficult to reliably test in JSDOM.
 * These tests focus on the core logic: hash parsing, navigation, and state management.
 */

describe('useLogLineNavigation', () => {
  let container: HTMLDivElement;
  const mockData = 'line 1\nline 2\nline 3\nline 4\nline 5';

  beforeEach(() => {
    // Clear hash before each test
    window.location.hash = '';

    // Create a mock DOM structure that mimics PatternFly LogViewer
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock log viewer structure
    const list = document.createElement('div');
    list.className = 'pf-v5-c-log-viewer__list';

    for (let i = 1; i <= 5; i++) {
      const listItem = document.createElement('div');
      listItem.className = 'pf-v5-c-log-viewer__list-item';

      const index = document.createElement('span');
      index.className = 'pf-v5-c-log-viewer__index';
      index.textContent = i.toString();

      listItem.appendChild(index);
      list.appendChild(listItem);
    }

    container.appendChild(list);
  });

  afterEach(() => {
    document.body.removeChild(container);
    window.location.hash = '';
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return logViewerRef, targetScrollRow, and onScrollComplete', () => {
      const { result } = renderHook(() => useLogLineNavigation(mockData));

      expect(result.current.logViewerRef).toBeDefined();
      expect(result.current.logViewerRef.current).toBeNull();
      expect(result.current.targetScrollRow).toBeNull();
      expect(typeof result.current.onScrollComplete).toBe('function');
    });

    it('should navigate to hash on mount if present in URL', async () => {
      window.location.hash = '#L2';

      const onDisableAutoScroll = jest.fn();
      const { result } = renderHook(() => useLogLineNavigation(mockData, { onDisableAutoScroll }));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      await waitFor(() => {
        expect(onDisableAutoScroll).toHaveBeenCalled();
      });
    });

    it('should not navigate if no hash on mount', () => {
      const onDisableAutoScroll = jest.fn();
      renderHook(() => useLogLineNavigation(mockData, { onDisableAutoScroll }));

      expect(onDisableAutoScroll).not.toHaveBeenCalled();
    });
  });

  describe('hash parsing and navigation', () => {
    it('should parse and navigate to single line hash #L3', async () => {
      window.location.hash = '#L3';

      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      await waitFor(() => {
        const highlightedLines = container.querySelectorAll('.log-line-selected');
        expect(highlightedLines.length).toBeGreaterThan(0);
      });
    });

    it('should parse and navigate to range hash #L2-L4', async () => {
      window.location.hash = '#L2-L4';

      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      await waitFor(() => {
        const highlightedLines = container.querySelectorAll('.log-line-selected');
        expect(highlightedLines.length).toBeGreaterThan(1);
      });
    });

    it('should handle invalid hash gracefully', () => {
      window.location.hash = '#invalid';

      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      const highlightedLines = container.querySelectorAll('.log-line-selected');
      expect(highlightedLines).toHaveLength(0);
    });

    it('should handle empty hash', () => {
      window.location.hash = '';

      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      const highlightedLines = container.querySelectorAll('.log-line-selected');
      expect(highlightedLines).toHaveLength(0);
    });
  });

  describe('hash change handling', () => {
    it('should set targetScrollRow when hash changes externally', async () => {
      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      // Simulate external hash change (e.g., URL edit, back/forward)
      act(() => {
        window.location.hash = '#L3';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBe(3);
      });
    });

    it('should clear highlights when hash is removed', async () => {
      // Start with a hash
      window.location.hash = '#L2';

      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      // Wait for initial highlights
      await waitFor(() => {
        const highlightedLines = container.querySelectorAll('.log-line-selected');
        expect(highlightedLines.length).toBeGreaterThan(0);
      });

      // Remove hash
      act(() => {
        window.location.hash = '';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        const highlightedLines = container.querySelectorAll('.log-line-selected');
        expect(highlightedLines).toHaveLength(0);
      });
    });
  });

  describe('scroll management', () => {
    it('should set targetScrollRow for external hash changes', async () => {
      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      act(() => {
        window.location.hash = '#L4';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBe(4);
      });
    });

    it('should clear targetScrollRow after scroll completes', async () => {
      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      // Trigger hash change
      act(() => {
        window.location.hash = '#L3';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBe(3);
      });

      // Simulate scroll complete
      act(() => {
        result.current.onScrollComplete();
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBeNull();
      });
    });
  });

  describe('browser navigation', () => {
    it('should handle back button navigation', async () => {
      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      // Navigate to L2
      act(() => {
        window.location.hash = '#L2';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBe(2);
      });

      // Navigate to L4
      act(() => {
        window.location.hash = '#L4';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBe(4);
      });

      // Simulate back button (go back to L2)
      act(() => {
        window.location.hash = '#L2';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBe(2);
      });
    });

    it('should handle forward button navigation', async () => {
      const { result } = renderHook(() => useLogLineNavigation(mockData));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      // Navigate to L2
      act(() => {
        window.location.hash = '#L2';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBe(2);
      });

      // Complete the scroll
      act(() => {
        result.current.onScrollComplete();
      });

      // Navigate to L4
      act(() => {
        window.location.hash = '#L4';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(result.current.targetScrollRow).toBe(4);
      });
    });
  });

  describe('onDisableAutoScroll callback', () => {
    it('should call onDisableAutoScroll when navigating to hash', async () => {
      const onDisableAutoScroll = jest.fn();
      const { result } = renderHook(() => useLogLineNavigation(mockData, { onDisableAutoScroll }));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      act(() => {
        window.location.hash = '#L3';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(onDisableAutoScroll).toHaveBeenCalled();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle ref being null', () => {
      const { result } = renderHook(() => useLogLineNavigation(mockData));

      // Don't attach ref - leave it null
      act(() => {
        window.location.hash = '#L2';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      // Should not crash
      expect(result.current.logViewerRef.current).toBeNull();
    });

    it('should handle empty data', () => {
      const { result } = renderHook(() => useLogLineNavigation(''));

      act(() => {
        (result.current.logViewerRef as React.MutableRefObject<HTMLDivElement>).current = container;
      });

      act(() => {
        window.location.hash = '#L1';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      // Should not crash
      expect(result.current.targetScrollRow).toBe(1);
    });
  });
});
