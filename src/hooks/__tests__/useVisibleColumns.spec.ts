import { act, renderHook } from '@testing-library/react';
import { useVisibleColumns } from '../useVisibleColumns';

describe('useVisibleColumns', () => {
  const key = 'visible-columns-test';
  const defaults = new Set(['name', 'status']);

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('loads and persists column preferences in localStorage', () => {
    window.localStorage.setItem(key, JSON.stringify(['name']));

    const { result } = renderHook(() => useVisibleColumns(key, defaults));

    expect(result.current[0]).toEqual(new Set(['name']));
    act(() => result.current[1](new Set(['status'])));
    expect(window.localStorage.getItem(key)).toBe(JSON.stringify(['status']));
  });

  it('migrates existing sessionStorage preferences to localStorage', () => {
    window.sessionStorage.setItem(key, JSON.stringify(['status']));

    const { result } = renderHook(() => useVisibleColumns(key, defaults));

    expect(result.current[0]).toEqual(new Set(['status']));
    expect(window.localStorage.getItem(key)).toBe(JSON.stringify(['status']));
    expect(window.sessionStorage.getItem(key)).toBeNull();
  });

  it('prefers localStorage when both stores have preferences', () => {
    window.localStorage.setItem(key, JSON.stringify(['name']));
    window.sessionStorage.setItem(key, JSON.stringify(['status']));

    const { result } = renderHook(() => useVisibleColumns(key, defaults));

    expect(result.current[0]).toEqual(new Set(['name']));
    expect(window.sessionStorage.getItem(key)).toBeNull();
  });
});
