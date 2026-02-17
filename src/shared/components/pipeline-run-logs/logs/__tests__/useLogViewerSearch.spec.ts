import { renderHook, act } from '@testing-library/react-hooks';
import { useLogViewerSearch } from '../useLogViewerSearch';

describe('useLogViewerSearch', () => {
  const mockLines = ['line 1', 'line 2 with error', 'line 3', 'another error line 4'];

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      expect(result.current.logViewerContextValue.parsedData).toEqual(mockLines);
      expect(result.current.logViewerContextValue.searchedInput).toBe('');
      expect(result.current.toolbarContextValue.searchedWordIndexes).toEqual([]);
      expect(result.current.toolbarContextValue.currentSearchedItemCount).toBe(0);
      expect(result.current.toolbarContextValue.rowInFocus).toEqual({
        rowIndex: -1,
        matchIndex: -1,
      });
    });

    it('should provide itemCount from lines length', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      expect(result.current.toolbarContextValue.itemCount).toBe(mockLines.length);
    });
  });

  describe('scrolledRow calculation', () => {
    it('should return 0 when autoScroll is false and no search focus', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      expect(result.current.scrolledRow).toBe(0);
    });

    it('should return lines.length when autoScroll is true and no search focus', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: true }),
      );

      expect(result.current.scrolledRow).toBe(mockLines.length);
    });

    it('should return rowInFocus index + 1 when search has focus', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      act(() => {
        result.current.toolbarContextValue.setRowInFocus({ rowIndex: 2, matchIndex: 1 });
      });

      expect(result.current.scrolledRow).toBe(3); // rowIndex 2 + 1
    });

    it('should prioritize search focus over autoScroll', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: true }),
      );

      act(() => {
        result.current.toolbarContextValue.setRowInFocus({ rowIndex: 1, matchIndex: 1 });
      });

      // Even with autoScroll true, should scroll to search match
      expect(result.current.scrolledRow).toBe(2); // rowIndex 1 + 1
    });
  });

  describe('search state management', () => {
    it('should update searchedInput', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      act(() => {
        result.current.toolbarContextValue.setSearchedInput('error');
      });

      expect(result.current.toolbarContextValue.searchedInput).toBe('error');
      expect(result.current.logViewerContextValue.searchedInput).toBe('error');
    });

    it('should update searchedWordIndexes', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      const searchIndexes = [
        { rowIndex: 1, matchIndex: 1 },
        { rowIndex: 3, matchIndex: 1 },
      ];

      act(() => {
        result.current.toolbarContextValue.setSearchedWordIndexes(searchIndexes);
      });

      expect(result.current.toolbarContextValue.searchedWordIndexes).toEqual(searchIndexes);
    });

    it('should update currentSearchedItemCount', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      act(() => {
        result.current.toolbarContextValue.setCurrentSearchedItemCount(5);
      });

      expect(result.current.toolbarContextValue.currentSearchedItemCount).toBe(5);
    });

    it('should update rowInFocus via setRowInFocus', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      const focusedRow = { rowIndex: 2, matchIndex: 3 };

      act(() => {
        result.current.toolbarContextValue.setRowInFocus(focusedRow);
      });

      expect(result.current.toolbarContextValue.rowInFocus).toEqual(focusedRow);
    });

    it('should update rowInFocus via scrollToRow callback', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      const targetRow = { rowIndex: 1, matchIndex: 2 };

      act(() => {
        result.current.toolbarContextValue.scrollToRow(targetRow);
      });

      expect(result.current.toolbarContextValue.rowInFocus).toEqual(targetRow);
    });
  });

  describe('context values stability', () => {
    it('should maintain stable context references when inputs unchanged', () => {
      const { result, rerender } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      const firstLogViewerContext = result.current.logViewerContextValue;
      const firstToolbarContext = result.current.toolbarContextValue;

      rerender();

      // References should be stable due to useMemo
      expect(result.current.logViewerContextValue).toBe(firstLogViewerContext);
      expect(result.current.toolbarContextValue).toBe(firstToolbarContext);
    });

    it('should update context when lines change', () => {
      const { result, rerender } = renderHook(
        ({ lines }) => useLogViewerSearch({ lines, autoScroll: false }),
        { initialProps: { lines: mockLines } },
      );

      const firstLogViewerContext = result.current.logViewerContextValue;

      const newLines = ['new line 1', 'new line 2'];
      rerender({ lines: newLines });

      // LogViewerContext should update due to lines change
      expect(result.current.logViewerContextValue).not.toBe(firstLogViewerContext);
      expect(result.current.logViewerContextValue.parsedData).toEqual(newLines);
    });
  });

  describe('edge cases', () => {
    it('should handle empty lines array', () => {
      const { result } = renderHook(() => useLogViewerSearch({ lines: [], autoScroll: false }));

      expect(result.current.logViewerContextValue.parsedData).toEqual([]);
      expect(result.current.toolbarContextValue.itemCount).toBe(0);
      expect(result.current.scrolledRow).toBe(0);
    });

    it('should handle single line', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: ['single line'], autoScroll: true }),
      );

      expect(result.current.scrolledRow).toBe(1);
    });

    it('should handle negative rowIndex in rowInFocus', () => {
      const { result } = renderHook(() =>
        useLogViewerSearch({ lines: mockLines, autoScroll: false }),
      );

      act(() => {
        result.current.toolbarContextValue.setRowInFocus({ rowIndex: -1, matchIndex: -1 });
      });

      // With negative rowIndex, should fall back to autoScroll logic
      expect(result.current.scrolledRow).toBe(0);
    });
  });
});
