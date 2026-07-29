import { renderHook, act } from '@testing-library/react';
import { useLogSearch } from '../useLogSearch';

describe('useLogSearch', () => {
  const lines = [
    'INFO Starting build',
    'WARN Dependency not found',
    'ERROR Build failed',
    'INFO Retrying build',
    'INFO Build succeeded',
  ];

  it('should return no matches for empty search text', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    expect(result.current.matchCount).toBe(0);
    expect(result.current.currentMatch).toBeUndefined();
    expect(result.current.scrollToRow).toBe(0);
  });

  it('finds matches across multiple lines', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('INFO'));

    expect(result.current.matchCount).toBe(3);
    expect(result.current.currentMatchIndex).toBe(0);
    expect(result.current.currentMatch).toEqual({ rowIndex: 0, matchIndex: 1 });
  });

  it('searches case-insensitively', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('info'));

    expect(result.current.matchCount).toBe(3);
  });

  it('finds multiple matches within a single line', () => {
    const repeatingLines = ['foo bar foo baz foo'];
    const { result } = renderHook(() => useLogSearch({ lines: repeatingLines }));

    act(() => result.current.setSearchText('foo'));

    expect(result.current.matchCount).toBe(3);
    expect(result.current.currentMatch).toEqual({ rowIndex: 0, matchIndex: 1 });
  });

  it('navigates forward through matches with nextMatch', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('INFO'));

    expect(result.current.currentMatchIndex).toBe(0);

    act(() => result.current.nextMatch());
    expect(result.current.currentMatchIndex).toBe(1);

    act(() => result.current.nextMatch());
    expect(result.current.currentMatchIndex).toBe(2);
  });

  it('wraps around from last to first with nextMatch', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('INFO'));

    act(() => result.current.nextMatch());
    act(() => result.current.nextMatch());
    expect(result.current.currentMatchIndex).toBe(2);

    act(() => result.current.nextMatch());
    expect(result.current.currentMatchIndex).toBe(0);
  });

  it('navigates backward through matches with prevMatch', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('INFO'));

    act(() => result.current.nextMatch());
    act(() => result.current.nextMatch());
    expect(result.current.currentMatchIndex).toBe(2);

    act(() => result.current.prevMatch());
    expect(result.current.currentMatchIndex).toBe(1);
  });

  it('wraps around from first to last with prevMatch', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('INFO'));

    act(() => result.current.prevMatch());
    expect(result.current.currentMatchIndex).toBe(2);
  });

  it('should return correct 1-indexed scrollToRow', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('ERROR'));

    expect(result.current.matchCount).toBe(1);
    expect(result.current.currentMatch).toEqual({ rowIndex: 2, matchIndex: 1 });
    expect(result.current.scrollToRow).toBe(3);
  });

  it('resets currentMatchIndex when search text changes', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('INFO'));
    act(() => result.current.nextMatch());
    act(() => result.current.nextMatch());
    expect(result.current.currentMatchIndex).toBe(2);

    act(() => result.current.setSearchText('WARN'));
    expect(result.current.currentMatchIndex).toBe(0);
    expect(result.current.matchCount).toBe(1);
  });

  it('should return no matches when search text does not match any line', () => {
    const { result } = renderHook(() => useLogSearch({ lines }));

    act(() => result.current.setSearchText('NONEXISTENT'));

    expect(result.current.matchCount).toBe(0);
    expect(result.current.currentMatch).toBeUndefined();
    expect(result.current.scrollToRow).toBe(0);
  });

  it('handles empty lines array', () => {
    const { result } = renderHook(() => useLogSearch({ lines: [] }));

    act(() => result.current.setSearchText('test'));

    expect(result.current.matchCount).toBe(0);
    expect(result.current.currentMatch).toBeUndefined();
  });
});
