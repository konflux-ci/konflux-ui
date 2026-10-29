import { act, renderHook } from '@testing-library/react';
import { useSessionStorage } from '~/shared/hooks/useSessionStorage';

const TEST_KEY = 'test-use-session-storage-key';

describe('useSessionStorage', () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
    window.sessionStorage.removeItem(TEST_KEY);
  });

  it('returns undefined when the key is missing and no initial value is provided', () => {
    const { result } = renderHook(() => useSessionStorage<string>(TEST_KEY));

    expect(result.current[0]).toBeUndefined();
  });

  it('returns the initial value when the key is missing', () => {
    const initialValue = { status: 'initial' };
    const { result } = renderHook(() => useSessionStorage(TEST_KEY, initialValue));

    expect(result.current[0]).toEqual(initialValue);
  });

  it('reads the value from sessionStorage', () => {
    window.localStorage.setItem(TEST_KEY, JSON.stringify('local value'));
    window.sessionStorage.setItem(TEST_KEY, JSON.stringify('session value'));

    const { result } = renderHook(() => useSessionStorage<string>(TEST_KEY));

    expect(result.current[0]).toBe('session value');
  });

  it('writes JSON values to sessionStorage without changing localStorage', () => {
    window.localStorage.setItem(TEST_KEY, JSON.stringify('keep local value'));
    const { result } = renderHook(() => useSessionStorage<{ count: number }>(TEST_KEY));

    act(() => {
      result.current[1]({ count: 3 });
    });

    expect(result.current[0]).toEqual({ count: 3 });
    expect(JSON.parse(window.sessionStorage.getItem(TEST_KEY) ?? 'null')).toEqual({ count: 3 });
    expect(JSON.parse(window.localStorage.getItem(TEST_KEY) ?? 'null')).toBe('keep local value');
  });

  it('supports updater functions when no value is stored yet', () => {
    const { result } = renderHook(() => useSessionStorage<number>(TEST_KEY));

    act(() => {
      result.current[1]((previousValue) => (previousValue ?? 0) + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(JSON.parse(window.sessionStorage.getItem(TEST_KEY) ?? 'null')).toBe(1);
  });

  it('removes the stored value and returns to the initial value', () => {
    window.sessionStorage.setItem(TEST_KEY, JSON.stringify('stored value'));
    const { result } = renderHook(() => useSessionStorage(TEST_KEY, 'initial value'));

    act(() => {
      result.current[2]();
    });

    expect(window.sessionStorage.getItem(TEST_KEY)).toBeNull();
    expect(result.current[0]).toBe('initial value');
  });

  it('synchronizes hook instances that share a key', () => {
    const { result } = renderHook(() => [
      useSessionStorage<number>(TEST_KEY),
      useSessionStorage<number>(TEST_KEY),
    ]);

    act(() => {
      result.current[0][1](7);
    });

    expect(result.current[0][0]).toBe(7);
    expect(result.current[1][0]).toBe(7);
  });

  it('responds to session storage events and ignores local storage events', () => {
    window.sessionStorage.setItem(TEST_KEY, JSON.stringify('before event'));
    const { result } = renderHook(() => useSessionStorage<string>(TEST_KEY));
    window.sessionStorage.setItem(TEST_KEY, JSON.stringify('after event'));

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: TEST_KEY, storageArea: window.localStorage }),
      );
    });
    expect(result.current[0]).toBe('before event');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: TEST_KEY, storageArea: window.sessionStorage }),
      );
    });
    expect(result.current[0]).toBe('after event');
  });
});
